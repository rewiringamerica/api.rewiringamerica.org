DROP TABLE IF EXISTS ami;

DROP TABLE IF EXISTS zips;

DROP TABLE IF EXISTS tracts;

DROP TABLE IF EXISTS zip_to_tract;

DROP TABLE IF EXISTS zip_to_cbsasub;

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

CREATE INDEX idx_zipzip ON zips(zip);

CREATE INDEX idx_tractgeoid ON tracts(tract_geoid);

CREATE INDEX idx_ziptract ON zip_to_tract(zip);

CREATE INDEX idx_zipcbsasub ON zip_to_cbsasub(zipcode);

CREATE INDEX idx_amicbsasub ON ami(cbsasub);

.import --csv ./scripts/data/ami.csv ami
.import --csv ./scripts/data/zips.csv zips
.import --csv ./scripts/data/tracts.csv tracts
.import --csv ./scripts/data/zip-to-tract.csv zip_to_tract
.import --csv ./scripts/data/zip-to-cbsasub.csv zip_to_cbsasub
