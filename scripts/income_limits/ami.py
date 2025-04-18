import re
import pandas as pd
import util

"""
Creates AMI income threshold tables by county/countysub, zcta, tract, and territory.
Note that this takes ~30 minutes to run and that all APIs will pull
the most recently available data year unless otherwise specified.
"""

# -- 1. AMI data by county/countysub -- #
# Create table of MFIs and AMIs for each county level
# (or county subdivision  in the case of New England states)

# Pull MFI, 30%, 50%, 80% AMI from API. Takes ~30 min
# currently ~10 counties/county subs throw errors, see hud_ami_api_error.log.
print(f"Pulling AMI data...")
mfi_ami80_by_countysub = pd.concat([
    util.pull_state_amis_by_countysub(state_postal_code=state, year=2024, verbose=True)
    for state in util.STATE_POSTAL_TO_GEOID.keys()]
)

# Read in 100% and 150% AMI from HAF
# NOTE: if the year naming convention of the column names changes, this might require modification
string_cols = ['fips2010', 'State', 'County']
# match 4 person hh AMIs for 100% and 150% AMI
base_ami_match_pattern = "HAF(100|150).*p4"
ami150_by_countysub = pd.read_excel(
    util.DATA_FPATH / 'raw' / 'il_all100_150_HAF.xlsx',
    usecols=lambda x: x in string_cols or re.match(base_ami_match_pattern, x),
    dtype={'fips2010': str})

# rename to ami_100 and ami_150
ami150_by_countysub.rename(
    columns=lambda x: re.sub(base_ami_match_pattern, r"ami_\1", x), inplace=True)
# rename pkey column
ami150_by_countysub.rename(
    columns={'fips2010': 'countysub_geoid'}, inplace=True)

# Combine amis from the two data sources.
# Note that the ~10 county/countysubs that we could not pull AMIs for from the API
# will only have 100% and 150% AMIs since they only appear on the right side of the join
ami_by_countysub = pd.merge(
    mfi_ami80_by_countysub,
    ami150_by_countysub,
    on='countysub_geoid',
    how='right',
    validate="many_to_one")

# get county geoid from the first 5 digits of countysub geoid
ami_by_countysub['county_geoid'] = ami_by_countysub.countysub_geoid.str.slice(
    0, 5)

# add a state column
geoid_to_postal = {v: k for k, v in util.STATE_POSTAL_TO_GEOID.items()}
ami_by_countysub['state'] = ami_by_countysub.county_geoid.str.slice(
    0, 2).map(geoid_to_postal)

# add a column for 60 percent AMI
ami_by_countysub['ami_60'] = ami_by_countysub['ami_50'] * 1.2

# write this now since it takes a while to pull

geo_cols = ["countysub_geoid",  "county_geoid", "state",  "county_name",
            "counties_msa", "town_name", "metro_status", "metro_name", "area_name"]
ami_cols = ['median_family_income', 'ami_30',
            'ami_50', 'ami_60', 'ami_80', 'ami_100', 'ami_150']

fpath_out = util.DATA_FPATH / 'processed' / 'ami_by_countysub.csv'
print(f"Writing to {fpath_out}")
ami_by_countysub[geo_cols + ['year'] + ami_cols].to_csv(fpath_out, index=False)

# -- 2. Crosswalks from county sub to tract/zcta -- #
# read in data
string_cols = ['County code', 'County subdivision (2020)', 'tract']
tract_countysub_crosswalk = (
    util.clean_colnames(pd.read_csv(
        util.DATA_FPATH / 'raw' / 'geocorr_tract_to_countysub.csv',
        encoding="ISO-8859-1",
        low_memory=False,
        skiprows=1,
        dtype={col: str for col in string_cols}))
    .drop('county_name', axis=1)
)

zcta_countysub_crosswalk = (
    util.clean_colnames(pd.read_csv(
        util.DATA_FPATH / 'raw' / 'geocorr_zcta_to_countysub.csv',
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
# county_sub_geoid = 10 digit code: {county_code (5)}{county_subdivision_2020(5)}
# tract_geoid = 11 digit code: {county_code (5)}{tract_geoid(6)}
# Note that 'tract' in the file is stored as a float where the last two digits follow a decimal point
zcta_countysub_crosswalk['countysub_geoid'] = zcta_countysub_crosswalk.county_code + \
    zcta_countysub_crosswalk.county_subdivision_2020
tract_countysub_crosswalk['countysub_geoid'] = tract_countysub_crosswalk.county_code + \
    tract_countysub_crosswalk.county_subdivision_2020
tract_countysub_crosswalk['tract_geoid'] = tract_countysub_crosswalk.apply(
    lambda x: x.county_code + f"{x.tract:.2f}".replace('.', '').zfill(6), axis=1)

# -- 3. Map countysub AMIs to target geographies (ZCTA/tract) and aggregate over target -- #

# First, impute 80%, 50% and 30% AMI for any county/countysubs to pull from API (see error log)
missing_ami_80_mask = ami_by_countysub.ami_80.isna()
for ami_threshold in [30, 50, 60, 80]:
    ami_by_countysub.loc[missing_ami_80_mask,
                         f"ami_{ami_threshold}"] = ami_by_countysub.loc[missing_ami_80_mask, "ami_100"] * ami_threshold/100

# Join amis to zctas and to tracts, where new england states will match on countysub geoids
# and non-new england states will match on county geoids
# Note that unpopulated areas are not included in the crosswalk,
# so 15 unpopulated countysubs in New England get dropped in this join

# bool mask indicating if row is a county (True) or a county subdivision (False)
is_county_msk = ami_by_countysub.countysub_geoid.str.endswith('99999')

# There is one weird edge case "Sullivan city part of Crawford County",
# which is a countysub in MO, but the neither the county nor the countysub geoid
# appear in the crosswalk, so we will just map it to AMIs for Crawford County.
ami_by_countysub.loc[ami_by_countysub.county_geoid ==
                     '29056', ['county_geoid', 'county_name']] = ['29055', 'Crawford County, MO']

# join county and countysub amis to zcta
ami_county_zcta_non_new_england = (
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
    [ami_county_zcta_non_new_england, ami_countysub_zcta_new_england])

# join county and countysub amis to tract
ami_county_tract_non_new_england = (
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
    [ami_county_tract_non_new_england, ami_countysub_tract_new_england])

# Aggregate over countysubs to get AMI at target geography using strategy of minimizng type II error
ami_by_zcta = util.aggregate_over_origin(
    df=ami_countysub_zcta,
    groupby_cols=['zcta', 'zip_code_name'],
    agg_cols=ami_cols)

ami_by_tract = util.aggregate_over_origin(
    df=ami_countysub_tract,
    groupby_cols=['tract_geoid', 'state'],
    agg_cols=ami_cols)

# check that all zctas and tracts appear in the final tables
assert len(set(zcta_countysub_crosswalk.zcta).difference(
    ami_by_zcta.zcta)) == 0
assert len(set(tract_countysub_crosswalk.tract_geoid).difference(
    ami_by_tract.tract_geoid)) == 0

# check that all 60, 80%, and 100% AMI's are non-missing in the final tables
assert sum(ami_by_zcta.ami_60.isna() | ami_by_zcta.ami_80.isna() | ami_by_zcta.ami_100.isna()) == 0
assert sum(ami_by_tract.ami_60.isna() | ami_by_tract.ami_80.isna() | ami_by_tract.ami_100.isna()) == 0

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

fpath_out = util.DATA_FPATH / 'processed' / 'ami_by_zcta.csv'
print(f"Writing to {fpath_out}")
ami_by_zcta.to_csv(fpath_out, index=False)

fpath_out = util.DATA_FPATH / 'processed' / 'ami_by_tract.csv'
print(f"Writing to {fpath_out}")
ami_by_tract.to_csv(fpath_out, index=False)

fpath_out = util.DATA_FPATH / 'processed' / 'ami_by_territory_zip.csv'
print(f"Writing to {fpath_out}")
ami_by_territory_zip.to_csv(fpath_out, index=False)
