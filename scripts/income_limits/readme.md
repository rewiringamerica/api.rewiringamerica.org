# AMI/MFI Data

TODO: add high-level description.

A detailed description of the algorithm, data sources, and important terminology is provded [here](https://www.notion.so/rewiringamerica/AMI-MFI-for-Incentives-a18db19ff12840319472bc2803a63b31?pvs=4).


## Downloading Data

### AMI
PNNL has combined [Section 8 Income Limit data](https://www.huduser.gov/portal/datasets/il.html) and [Homeowner Assistance Fund (HAF) Income Limit data](https://www.huduser.gov/portal/datasets/haf-il.html) into a single table containing MFI, 80% AMI, and 150% AMI. If this is not maintained, data can be downloaded from the individual sources provided, where the former is also available [via API](https://www.huduser.gov/portal/dataset/fmr-api.html). 

**Refresh Rate: Annual. According to PNNL "These resources will be updated yearly after HHS and HUD publish new Federal Poverty Level (FPL) and Area Median Income (AMI) numbers."**

1. Go to [AMI resources](https://www.pnnl.gov/projects/rebate-tools#AMI%20Resources) and download the "AMI Tables" spreadsheet. 

This file is stored at `data/raw/2023_AMI_50_80_100_150_EL_from_HUD_240304_Update.xlsx` (note that filename will change with new updates). 

### Crosswalks
The Census Bureau reccomends using the Geocorrs provided by Missouri's State Data Center for crosswalks between non-nesting geographies. We use this resource for ZCTA <> County Subdivision <> and Tract <> County Subdivision crosswalks, which are needed to map AMI geographies and geographies of interest. 

**Refresh Rate: Annual(?). Maybe longer? These should roughly be updated when new ACS data is released, and updates should be announced [here](https://mcdc.missouri.edu/news/category/application-updates/)**

1. Go to the [geocorr website](https://mcdc.missouri.edu/applications/geocorr.html) and choose the most recent available year. 
2. Select all states
3. Select source geography: "Census tract". 
4. Select target geography: "County subdivision (township, MCD)"
5. Select weighting variable: "Housing units (2020 census)"
6. Click the first "Run Request" button to download CSV, and download the `geocorr{year}_*.csv` that is generated on the subsequent page. 

Repeat all steps, but choosing "ZIP/ZCTA" in step 3. 

These files should be saved to `data/raw/geocorr2022_tract_to_countysub.csv` and  `data/raw/geocorr2022_zcta_to_countysub.csv` respectively. 


TODO: check if all files should be named so that they don't change in subsequent refreshes. 