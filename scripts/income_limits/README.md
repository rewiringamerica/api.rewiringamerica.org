# AMI/MFI Data

Build tables for looking up AMI income thresholds and 30c tracts by tract and ZCTA.

A detailed description of the algorithm, data sources, and important terminology is provided [here](https://www.notion.so/rewiringamerica/AMI-MFI-for-Incentives-a18db19ff12840319472bc2803a63b31?pvs=4).

## Install

Requirements: Python >=3.10

Set up environment:

```
python3 -mvenv venv
source venv/bin/activate
pip install -r scripts/income_limits/requirements.txt
```

Add a `config.json` file in `scripts/income_limits/` with a HUD API key. The API key can be found in the Web Developers vault in RA's 1Password account.

```
{
    "hud_api_key" : "{API_KEY}"
}
```

## Downloading Data

### AMI

HUD publishes Homeowner Assistance Fund (HAF) Income Limit data which provides containing 150% AMI income thresholds. Note that all other AMI thresholds can be pulled via API, or downloaded as an excel spreadsheet from [HUD](https://www.huduser.gov/portal/datasets/il.html) at the "Data for Section 8 Income Limits" link. While using the downloaded data is faster than pulling from the API, which takes ~30 min, the spreadsheet had corrupted XML and may not be updated as quickly as the API, so we elected to use the API.

**Refresh Rate: Annual.**

1. Go to [Homeowner Assistance Fund Income Limits (HAF)](https://www.huduser.gov/portal/datasets/haf-il.html) and download the most recent excel spreadsheet under the "Data" tab.

Save this file as `data/raw/il_all100_150_HAF.xlsx`. Note that this removes the year suffix from the filename.

### 30C

ANL has constructed a map layer of the eligible 30c tracts.

**Refresh Rate: These will be valid through 2029, this does not need to be updated**

1. Go to [30C Tax Credit Eligibility Locator](https://experience.arcgis.com/experience/3f67d5e82dc64d1589714d5499196d4f/page/Page/) and download the ["30 all tracts" CSV](https://anl.app.box.com/s/kuybn61o5afa2a8x3knqu02bfgxd0wfg/file/1418411488204) following the link provided in the opening dialog box.

Save this file as `data/raw/30 all tracts.csv`.

### Crosswalks

The Census Bureau reccomends using the Geocorrs provided by Missouri's State Data Center for crosswalks between non-nesting geographies. We use this resource for ZCTA <> County Subdivision and Tract <> County Subdivision crosswalks, which are needed to map AMI geographies and geographies of interest.

**Refresh Rate: Annual(?). Maybe longer? These should roughly be updated when new ACS data is released, and updates should be announced [here](https://mcdc.missouri.edu/news/category/application-updates/)**

1. Go to the [geocorr website](https://mcdc.missouri.edu/applications/geocorr.html) and choose the most recent available year.
2. Select all states
3. Select source geography: "ZIP/ZCTA"
4. Select target geography: "County subdivision (township, MCD)"
5. Select weighting variable: "Housing units (2020 census)"
6. Click the first "Run Request" button to download CSV, and download the `geocorr{year}_*.csv` that is generated on the subsequent page.

Repeat all steps, but choosing "Census tract" in step 3.

Repeat all steps, but choosing "Census tract" in step 4. _Note that this crosswalk is used for the EV eligiblity calculations and thus should NOT be updated._

Save these files in `data/raw/` as `geocorr_zcta_to_countysub.csv`, `geocorr_tract_to_countysub.csv`, and `geocorr_zcta_to_tract.csv` respectively.

The current version of all the files in `data/raw` are also stored in [the cube](https://console.cloud.google.com/storage/browser/the-cube/data/raw/income_limits;tab=obje[…]iew=project&prefix=&forceOnObjectsSortingFiltering=false).
