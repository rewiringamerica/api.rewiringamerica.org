DROP TABLE IF EXISTS zips;
DROP TABLE IF EXISTS zip_to_utility;
DROP TABLE IF EXISTS ami_by_zcta;
DROP TABLE IF EXISTS ami_by_tract;
DROP TABLE IF EXISTS ami_by_territory_zip;
DROP TABLE IF EXISTS "30c_eligibility_by_zcta";
DROP TABLE IF EXISTS "30c_eligibility_by_tract_zcta";

CREATE TABLE zips(
    zip TEXT PRIMARY KEY,
    city TEXT,
    state_id TEXT,
    state_name TEXT,
    zcta TEXT,
    parent_zcta TEXT,
    county_fips TEXT,
    county_name TEXT
);

CREATE TABLE zip_to_utility(
    zip TEXT,
    utility_id TEXT,
    predominant INTEGER,
    UNIQUE (zip, utility_id)
) STRICT;

CREATE TABLE ami_by_zcta(
    zcta TEXT PRIMARY KEY,
    zip_code_name TEXT,
    median_family_income TEXT,
    ami_30 INT,
    ami_50 INT,
    ami_80 INT,
    ami_100 INT,
    ami_150 INT
) STRICT;

CREATE TABLE ami_by_tract(
    tract_geoid TEXT PRIMARY KEY,
    state TEXT,
    median_family_income TEXT,
    ami_30 INT,
    ami_50 INT,
    ami_80 INT,
    ami_100 INT,
    ami_150 INT
) STRICT;

CREATE TABLE ami_by_territory_zip(
    zip TEXT,
    state TEXT,
    median_family_income INT,
    ami_30 INT,
    ami_50 INT,
    ami_80 INT,
    ami_100 INT,
    ami_150 INT,
    UNIQUE (zip, state)
) STRICT;

CREATE TABLE "30c_eligibility_by_zcta"(
    zcta TEXT PRIMARY KEY,
    is_eligible TEXT
) STRICT;

CREATE TABLE "30c_eligibility_by_tract"(
    tract_geoid TEXT PRIMARY KEY,
    state TEXT,
    is_nonurban TEXT,
    is_low_income_community TEXT,
    is_eligible TEXT
) STRICT;

.import --csv --skip 1 ./scripts/data/zips.csv zips
.import --csv --skip 1 ./scripts/data/zip-to-utility.csv zip_to_utility
.import --csv --skip 1 ./scripts/income_limits/data/processed/ami_by_zcta.csv ami_by_zcta
.import --csv --skip 1 ./scripts/income_limits/data/processed/ami_by_tract.csv ami_by_tract
.import --csv --skip 1 ./scripts/income_limits/data/processed/ami_by_territory_zip.csv ami_by_territory_zip
.import --csv --skip 1 ./scripts/income_limits/data/processed/30c_eligibility_by_zcta.csv 30c_eligibility_by_zcta
.import --csv --skip 1 ./scripts/income_limits/data/processed/30c_eligibility_by_tract.csv 30c_eligibility_by_tract
