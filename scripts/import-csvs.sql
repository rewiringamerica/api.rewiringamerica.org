DROP TABLE IF EXISTS ami;

DROP TABLE IF EXISTS zips;

DROP TABLE IF EXISTS tracts;

DROP TABLE IF EXISTS zip_to_tract;

DROP TABLE IF EXISTS zip_to_cbsasub;

DROP TABLE IF EXISTS zcta_to_place;

DROP TABLE IF EXISTS zcta_to_countysub;

CREATE TABLE ami(
    State_Alpha TEXT,
    fips2010 TEXT,
    cbsasub TEXT,
    median2022 TEXT,
    Metro_Area_Name TEXT,
    county_town_name TEXT,
    l80_1 INTEGER,
    l80_2 INTEGER,
    l80_3 INTEGER,
    l80_4 INTEGER,
    l80_5 INTEGER,
    l80_6 INTEGER,
    l80_7 INTEGER,
    l80_8 INTEGER,
    l100_1 INTEGER,
    l100_2 INTEGER,
    l100_3 INTEGER,
    l100_4 INTEGER,
    l100_5 INTEGER,
    l100_6 INTEGER,
    l100_7 INTEGER,
    l100_8 INTEGER,
    l150_1 INTEGER,
    l150_2 INTEGER,
    l150_3 INTEGER,
    l150_4 INTEGER,
    l150_5 INTEGER,
    l150_6 INTEGER,
    l150_7 INTEGER,
    l150_8 INTEGER,
    state TEXT,
    county TEXT,
    County_Name TEXT,
    state_name TEXT,
    metro TEXT
);

CREATE TABLE zips(
    zip TEXT,
    city TEXT,
    state_id TEXT,
    state_name TEXT,
    zcta TEXT,
    parent_zcta TEXT,
    county_fips TEXT,
    county_name TEXT
);

CREATE TABLE tracts(
    tract_geoid TEXT,
    total_pop INTEGER,
    poverty_pop INTEGER,
    poverty_percent REAL,
    mfi INTEGER,
    is_urban INTEGER
);

CREATE TABLE zip_to_tract(
    zip TEXT,
    tract TEXT,
    usps_zip_pref_city TEXT,
    usps_zip_pref_state TEXT,
    res_ratio REAL,
    bus_ratio REAL,
    oth_ratio REAL,
    tot_ratio REAL
);

CREATE TABLE zip_to_cbsasub(zipcode TEXT, cbsasub TEXT);

CREATE TABLE zcta_to_place(
  oid_zcta5_20 TEXT,
  geoid_zcta5_20 TEXT,
  namelsad_zcta5_20 TEXT,
  arealand_zcta5_20 TEXT,
  areawater_zcta5_20 TEXT,
  mtfcc_zcta5_20 TEXT,
  classfp_zcta5_20 TEXT,
  funcstat_zcta5_20 TEXT,
  oid_place_20 TEXT,
  geoid_place_20 TEXT,
  namelsad_place_20 TEXT,
  arealand_place_20 TEXT,
  areawater_place_20 TEXT,
  mtfcc_place_20 TEXT,
  classfp_place_20 TEXT,
  funcstat_place_20 TEXT,
  arealand_part TEXT,
  areawater_part TEXT
);

CREATE TABLE zcta_to_countysub(
  oid_zcta5_20 TEXT,
  geoid_zcta5_20 TEXT,
  namelsad_zcta5_20 TEXT,
  arealand_zcta5_20 TEXT,
  areawater_zcta5_20 TEXT,
  mtfcc_zcta5_20 TEXT,
  classfp_zcta5_20 TEXT,
  funcstat_zcta5_20 TEXT,
  oid_cousub_20 TEXT,
  geoid_cousub_20 TEXT,
  namelsad_cousub_20 TEXT,
  arealand_cousub_20 TEXT,
  areawater_cousub_20 TEXT,
  mtfcc_cousub_20 TEXT,
  classfp_cousub_20 TEXT,
  funcstat_cousub_20 TEXT,
  arealand_part TEXT,
  areawater_part TEXT
);


CREATE INDEX idx_zipzip ON zips(zip);

CREATE INDEX idx_tractgeoid ON tracts(tract_geoid);

CREATE INDEX idx_ziptract ON zip_to_tract(zip);

CREATE INDEX idx_zipcbsasub ON zip_to_cbsasub(zipcode);

CREATE INDEX idx_amicbsasub ON ami(cbsasub);

CREATE INDEX idx_zctaplace ON zcta_to_place(geoid_zcta5_20);

CREATE INDEX idx_zctacountysub ON zcta_to_countysub(geoid_zcta5_20);

.import --csv --skip 1 ./scripts/data/ami.csv ami
.import --csv --skip 1 ./scripts/data/zips.csv zips
.import --csv --skip 1 ./scripts/data/tracts.csv tracts
.import --csv --skip 1 ./scripts/data/zip-to-tract.csv zip_to_tract
.import --csv --skip 1 ./scripts/data/zip-to-cbsasub.csv zip_to_cbsasub
.import --skip 1 ./scripts/data/zcta_to_place.txt zcta_to_place
.import --skip 1 ./scripts/data/zcta_to_countysub.txt zcta_to_countysub