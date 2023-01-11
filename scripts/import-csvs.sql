DROP TABLE IF EXISTS ami;

DROP TABLE IF EXISTS zips;

DROP TABLE IF EXISTS tracts;

DROP TABLE IF EXISTS zip_to_tract;

DROP TABLE IF EXISTS zip_to_cbsasub;

DROP TABLE IF EXISTS ira_incentives;

DROP TABLE IF EXISTS ira_state_savings;

DROP TABLE IF EXISTS solar_prices;

DROP TABLE IF EXISTS state_mfi;

DROP TABLE IF EXISTS tax_brackets;

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

.import --csv ./data/ami.csv ami
.import --csv ./data/zips.csv zips
.import --csv ./data/tracts.csv tracts
.import --csv ./data/zip-to-tract.csv zip_to_tract
.import --csv ./data/zip-to-cbsasub.csv zip_to_cbsasub
CREATE TABLE ira_incentives(
    type TEXT,
    program TEXT,
    program_es TEXT,
    item TEXT,
    item_es TEXT,
    more_info_url TEXT,
    more_info_url_es TEXT,
    amount NUMERIC,
    amount_type TEXT,
    representative_amount INTEGER,
    item_type TEXT,
    owner_status JSON_ARRAY,
    ami_qualification TEXT,
    agi_max_limit TEXT,
    filing_status TEXT,
    start_date INTEGER,
    end_date INTEGER
);

INSERT INTO
    ira_incentives
SELECT
    JSON_EXTRACT(value, '$.type'),
    JSON_EXTRACT(value, '$.program'),
    JSON_EXTRACT(value, '$.program_es'),
    JSON_EXTRACT(value, '$.item'),
    JSON_EXTRACT(value, '$.item_es'),
    JSON_EXTRACT(value, '$.more_info_url'),
    JSON_EXTRACT(value, '$.more_info_url_es'),
    JSON_EXTRACT(value, '$.amount'),
    JSON_EXTRACT(value, '$.amount_type'),
    JSON_EXTRACT(value, '$.representative_amount'),
    JSON_EXTRACT(value, '$.item_type'),
    -- FIXME: not serializing as-is:
    JSON_EXTRACT(value, '$.owner_status'),
    JSON_EXTRACT(value, '$.ami_qualification'),
    JSON_EXTRACT(value, '$.agi_max_limit'),
    JSON_EXTRACT(value, '$.filing_status'),
    JSON_EXTRACT(value, '$.start_date'),
    JSON_EXTRACT(value, '$.end_date')
FROM
    JSON_EACH(READFILE('./data/ira_incentives.json'));

CREATE TABLE ira_state_savings(
    state TEXT,
    estimated_savings_heat_pump_ev INTEGER,
    estimated_savings_electrify_solar INTEGER,
    -- FIXME: estimated?
    estimate_savings_space_heat INTEGER,
    estimated_savings_water_heater INTEGER,
    estimated_savings_ev INTEGER,
    estimated_savings_space_heat_ev INTEGER,
    estimated_savings_water_heater_solar INTEGER,
    estimated_savings_solar_ev INTEGER
);

INSERT INTO
    ira_state_savings
SELECT
    key,
    JSON_EXTRACT(value, '$.estimated_savings_heat_pump_ev'),
    JSON_EXTRACT(value, '$.estimated_savings_electrify_solar'),
    JSON_EXTRACT(value, '$.estimate_savings_space_heat'),
    JSON_EXTRACT(value, '$.estimated_savings_water_heater'),
    JSON_EXTRACT(value, '$.estimated_savings_ev'),
    JSON_EXTRACT(value, '$.estimated_savings_space_heat_ev'),
    JSON_EXTRACT(value, '$.estimated_savings_water_heater_solar'),
    JSON_EXTRACT(value, '$.estimated_savings_solar_ev')
FROM
    JSON_EACH(READFILE('./data/ira_state_savings.json'));

CREATE TABLE solar_prices(
    state_name TEXT,
    system_cost INTEGER,
    cost_per_watt NUMERIC,
    tax_credit NUMERIC
);

INSERT INTO
    solar_prices
SELECT
    key,
    JSON_EXTRACT(value, '$.system_cost'),
    JSON_EXTRACT(value, '$.cost_per_watt'),
    JSON_EXTRACT(value, '$.tax_credit')
FROM
    JSON_EACH(READFILE('./data/solar_prices.json'));

CREATE TABLE state_mfi(
    state_name TEXT,
    TOTAL INTEGER,
    METRO INTEGER,
    NONMETRO INTEGER
);

INSERT INTO
    state_mfi
SELECT
    key,
    JSON_EXTRACT(value, '$.TOTAL'),
    JSON_EXTRACT(value, '$.METRO'),
    JSON_EXTRACT(value, '$.NONMETRO')
FROM
    JSON_EACH(READFILE('./data/state_mfi.json'));

CREATE TABLE tax_brackets(
    filing_status TEXT,
    income_min INTEGER,
    income_max INTEGER,
    tax_rate NUMERIC,
    tax_amount NUMERIC,
    standard_deduction INTEGER
);

INSERT INTO
    tax_brackets
SELECT
    JSON_EXTRACT(value, '$.filing_status'),
    JSON_EXTRACT(value, '$.income_min'),
    JSON_EXTRACT(value, '$.income_max'),
    JSON_EXTRACT(value, '$.tax_rate'),
    JSON_EXTRACT(value, '$.tax_amount'),
    JSON_EXTRACT(value, '$.standard_deduction')
FROM
    JSON_EACH(READFILE('./data/tax_brackets.json'));