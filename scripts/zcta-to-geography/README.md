# zcta-to-geography.py

This script regenerates the mapping from ZCTAs (roughly, ZIP codes) to geography IDs (as stored in `data/geographies.json`).

## Running

1. Download three TIGER/Line shapefiles from the Census Bureau. Start from [this page](https://www2.census.gov/geo/tiger/TIGER2024/), and then navigate into each of the following subdirectories and download the single zip file in each.

   - `ZCTA520`
   - `STATE`
   - `COUNTY`

   Don't unzip the files.

   **If there is a newer vintage of data than 2024**, you can use that, but you'll need to make sure the geographies stored in HERO are up to date, and to change the Geocodio call in this codebase to request Census fields of the newer vintage.

2. Set up venv and install dependencies:

   1. `python3 -m venv venv`
   2. `. venv/bin/activate`
   3. `python3 -m pip install -r requirements.txt`

3. Run the script, passing the path to the ZCTA file, states file, and counties file from step 1, in that order. (You can run `./zcta-to-geography.py --help` to see the arguments.)

   The script reads from `data/geographies.json` and writes to `scripts/data/zcta-to-geography.csv`

   The script takes around two minutes to run. (And consumes multiple gigabytes of memory.)

4. Run `yarn build` to load the new mapping into the SQLite database used at runtime.
