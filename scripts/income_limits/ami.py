import numpy as np
import pandas as pd

import scripts.income_limits.util as util

"""
Creates AMI income threshold tables by county/countysub, zcta, tract, and territory. 
Note that this takes ~30 minutes to run. 
Note that all APIs will pull the most recently available data year unless otherwise specified.
"""

# -- 1. AMI data by county/countysub -- #
# Create table of MFIs and AMIs for each county level
# (or county subdivision  in the case of New England states)

# Pull MFI, 30%, 50%, 80% AMI from API. Note only
# currently ~10 counties/county subs throw errors, see hud_ami_api_error.log.
mfi_ami80_by_countysub = pd.concat([
    util.pull_state_amis_by_countysub(state_postal_code=state, verbose=True)
    for state in util.STATE_POSTAL_TO_GEOID.keys()]
)

# mfi_ami80_by_countysub.to_csv(
#     util.DATA_FPATH / 'processed' / 'ami_by_county_countysub.csv', index=False)

# str_cols = ['counties_msa', 'county_geoid', 'countysub_geoid']
# mfi_ami80_by_countysub = pd.read_csv(
#     util.DATA_FPATH / 'processed' / 'ami_by_county_countysub.csv',
#     dtype={col: str for col in str_cols})

# Read in 150% AMI from HAP
string_cols = ['fips2010', 'State', 'County']
ami150_by_countysub = pd.read_excel(
    util.DATA_FPATH / 'raw' / 'il24_all100_150_HAF.xlsx',
    usecols=['fips2010', 'HAF100_24p4', 'HAF150_24p4'],
    dtype={'fips2010': str})

ami150_by_countysub.rename(
    {'fips2010': 'countysub_geoid',
     'HAF100_24p4': 'ami_100',
     'HAF150_24p4': 'ami_150'},
    axis=1,
    inplace=True)

# Combine amis from the two data sources.
# Note that the ~10 county/countysubs that we could not pull AMIs for from the API
# will only have 100% and 150% AMIs since they only appear on the right side of the join
ami_by_countysub = pd.merge(
    mfi_ami80_by_countysub,
    ami150_by_countysub,
    on='countysub_geoid',
    how='right',
    validate="many_to_one")

# add a state column
geoid_to_postal = {v: k for k, v in util.STATE_POSTAL_TO_GEOID.items()}
ami_by_countysub['state'] = ami_by_countysub.county_geoid.str.slice(
    0, 2).map(geoid_to_postal)

# -- 2. Crosswalks from county sub to tract/zcta -- #
# read in data
string_cols = ['County code', 'County subdivision (2020)']
tract_countysub_crosswalk = (
    util.clean_colnames(pd.read_csv(
        util.DATA_FPATH / 'raw' / 'geocorr2022_tract_to_countysub.csv',
        encoding="ISO-8859-1",
        low_memory=False,
        skiprows=1,
        dtype={col: str for col in string_cols}))
    .drop('county_name', axis=1)
)

zcta_countysub_crosswalk = (
    util.clean_colnames(pd.read_csv(
        util.DATA_FPATH / 'raw' / 'geocorr2022_zcta_to_countysub.csv',
        encoding="ISO-8859-1",
        low_memory=False,
        skiprows=1,
        dtype={col: str for col in string_cols}))
    .rename({'zip_census_tabulation_area': 'zcta'}, axis=1)
    .drop('county_name', axis=1)
)

# remove non-zctas
zcta_countysub_crosswalk = zcta_countysub_crosswalk[
    zcta_countysub_crosswalk.zip_code_name != '[not in a ZCTA]']

# clean up geoids
zcta_countysub_crosswalk['countysub_geoid'] = zcta_countysub_crosswalk[['county_code',
                                                                        'county_subdivision_2020']].agg(''.join, axis=1)
tract_countysub_crosswalk['countysub_geoid'] = tract_countysub_crosswalk[['county_code',
                                                                          'county_subdivision_2020']].agg(''.join, axis=1)
tract_countysub_crosswalk['tract_geoid'] = tract_countysub_crosswalk.apply(
    lambda x: x.county_code + f"{x.tract:.2f}".replace('.', '').zfill(6), axis=1)

# -- 3. Map countysub AMIs to target geographies (ZCTA/tract) and aggregate over target -- #

# Join amis to zctas and to tracts, where new england states will match on countysub geoids
# and non-new england states will match on county geoids
# The following to not have a match in the crosswalk, and thus get dropped
# * 15 unpopulated countysubs in New England
# * Sullivan MO which is an edge case of a county sub outside New England
# TODO: add data checks for future refreshes?

# bool mask indicating if row is a county (True) or a county subdivision (False)
is_county_msk = ami_by_countysub.town_name.isna()

# join county and countysub amis to zcta
ami_countysub_zcta_non_new_england = (
    ami_by_countysub[is_county_msk]
    .merge(
        zcta_countysub_crosswalk.drop('countysub_geoid', axis=1),
        left_on='county_geoid',
        right_on='county_code')
)
ami_countysub_zcta_new_england = (
    ami_by_countysub[~is_county_msk]
    .merge(
        zcta_countysub_crosswalk,
        on='countysub_geoid')
)
ami_countysub_zcta = pd.concat(
    [ami_countysub_zcta_non_new_england, ami_countysub_zcta_new_england])

# join county and countysub amis to tract
ami_countysub_tract_non_new_england = (
    ami_by_countysub[is_county_msk]
    .merge(
        tract_countysub_crosswalk.drop('countysub_geoid', axis=1),
        left_on='county_geoid',
        right_on='county_code')
)
ami_countysub_tract_new_england = (
    ami_by_countysub[~is_county_msk]
    .merge(
        tract_countysub_crosswalk,
        on='countysub_geoid')
)
ami_countysub_tract = pd.concat(
    [ami_countysub_tract_non_new_england, ami_countysub_tract_new_england])

ami_cols = ['median_family_income', 'ami_30',
            'ami_50', 'ami_80', 'ami_100', 'ami_150']
# Aggregate over countysubs to get AMI at target geography using strategy of minimizng type II error
ami_by_zcta = util.aggregate_over_origin(
    df=ami_countysub_zcta,
    groupby_cols=['zcta', 'zip_code_name'],
    agg_cols=ami_cols)

ami_by_tract = util.aggregate_over_origin(
    df=ami_countysub_tract,
    groupby_cols=['tract_geoid', 'county_name', 'state'],
    agg_cols=ami_cols)

# -- 4. Create territory lookup  -- #
# For AS,GU,MP there is only one county over the whole territory,
# so we can just look these up by territory.
# For VI, we must map from zips to counties, and since zip -> county is many to one
# in VI, and all AMIs are defined at the county level, we can just look these up by zip.

# subset to only non-PR territories (AS,GU,MP,VI)
ami_territory = ami_by_countysub[ami_by_countysub.state.isin(
    util.TERRITORY_POSTAL_CODES)]

# Pull zip to county mapping for VI
zip_county_crosswalk_vi = util.get_zip_crosswalk(
    state_abbr='VI',
    crosswalk_type="zip-county").drop('state', axis=1)

# Left join territory AMIs to VI zip <> county mapping
# which results in a table by territory for AS,GU,MP and by zip for VI
ami_by_territory_zip = ami_territory.merge(
    zip_county_crosswalk_vi.rename(columns={'geoid': 'county_geoid'}),
    on='county_geoid',
    how='left')

# subset to cols of interest
ami_by_territory_zip = ami_by_territory_zip[['zip', 'state'] + ami_cols]

# -- 5. Write out AMI data at various levels of geographic aggregation-- #
ami_by_countysub.to_csv(util.DATA_FPATH / 'processed' /
                        'ami_by_countysub.csv', index=False)
ami_by_zcta.to_csv(util.DATA_FPATH / 'processed' /
                   'ami_by_zcta.csv', index=False)
ami_by_tract.to_csv(util.DATA_FPATH / 'processed' /
                    'ami_by_tract.csv', index=False)
ami_by_territory_zip.to_csv(
    util.DATA_FPATH / 'processed' / 'ami_by_territory_zip.csv', index=False)
