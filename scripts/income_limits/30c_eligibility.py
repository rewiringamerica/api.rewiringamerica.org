
import pandas as pd
import scripts.income_limits.util as util
"""
Produce two tables indicating whether each tract or ZCTA is eligible for the 30C tax credit.
Note that all APIs will pull the most recently available data year unless otherwise specified.
"""

# -- 1. 30C tract eligibility -- #
eligibility_30c_by_tract = pd.read_csv(
    util.DATA_FPATH / 'raw' / '30C all tracts.csv',
    dtype={'nmtc': bool, 'nonurb': bool, 'tract': str})

eligibility_30c_by_tract.rename(
    columns={
        'tract': 'tract_geoid',
        'nmtc': 'is_low_income_community',
        'nonurb': 'is_nonurban'},
    inplace=True)

# state and county naming is non-standard so convert state col
# to be 2 letter code and drop county to avoid confusion
geoid_to_postal = {v: k for k, v in util.STATE_POSTAL_TO_GEOID.items()}
eligibility_30c_by_tract['state'] = eligibility_30c_by_tract.tract_geoid.str.slice(
    0, 2).map(geoid_to_postal)
eligibility_30c_by_tract.drop('county', axis=1, inplace=True)

# calculate whether tract is eligible under either criteria
eligibility_30c_by_tract['is_eligible'] = eligibility_30c_by_tract.is_low_income_community | eligibility_30c_by_tract.is_nonurban

# -- 2. ZCTA <> tract crosswalk -- #
zcta_tract_crosswalk = util.clean_colnames(pd.read_csv(
    util.DATA_FPATH / 'raw' / 'geocorr2022_zcta_to_tract.csv',
    encoding="ISO-8859-1",
    low_memory=False,
    skiprows=1,
    dtype={'County code': str})
).rename(columns={'zip_census_tabulation_area': 'zcta'})

# remove non-zctas
zcta_tract_crosswalk = zcta_tract_crosswalk[zcta_tract_crosswalk.zip_code_name != '[not in a ZCTA]']

# construct tract geoid
zcta_tract_crosswalk['tract_geoid'] = zcta_tract_crosswalk.apply(
    lambda x: x.county_code + f"{x.tract:.2f}".replace('.', '').zfill(6), axis=1)

zcta_tract_crosswalk = zcta_tract_crosswalk[[
    'zcta', 'tract_geoid', 'zcta_to_tract_allocation_factor']]

# -- 3. Join tract eligibility to crosswalk -- #
# dropped from left table: territories AS, GU, VI, MP and 0 population tracts
# note that the entiruty of these 4 territories are non-urban and therefore eligible,
# so these can be handled upstream
eligibility_30c_by_tract_zcta = eligibility_30c_by_tract.merge(
    zcta_tract_crosswalk, on='tract_geoid')

# aggregate over tracts in each zip minimizing type II error"
# zip is_eligible iff all intersecting tracts are eligible
eligibility_30c_by_zcta = util.aggregate_over_origin(
    df=eligibility_30c_by_tract_zcta,
    groupby_cols=['zcta'],
    agg_cols=['is_eligible'],
    minimize_type_2_error=True)


# -- 4. Write out data -- #

# write out table with all zctas x tracts to allow for tract lookup and
# custom zip logic on front end
eligibility_30c_by_tract_zcta.to_csv(
    util.DATA_FPATH / 'processed' / '30c_eligibility_by_tract_zcta.csv', index=False)
# write out table with all zctas with min typeII error logic already applied
eligibility_30c_by_zcta.to_csv(
    util.DATA_FPATH / 'processed' / '30c_eligibility_by_zcta.csv', index=False)
