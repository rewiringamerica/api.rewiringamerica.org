# zcta-to-geography.py

This script regenerates the mapping from ZCTAs (roughly, ZIP codes) to geography IDs (as stored in `data/geographies.json`).

## Running

1. Set up venv and install dependencies:

   1. `python3 -m venv venv`
   2. `. venv/bin/activate`
   3. `python3 -m pip install -r requirements.txt`

2. Run the script: `./zcta-to-geography.py`. It will download the required Census shapefiles and cache them in a directory called `shapefiles` within this directory, so the files are only downloaded once.

   The script reads from `scripts/data/geographies.csv` and writes to `scripts/data/zcta-to-geography.csv`.

   The script takes around two minutes to run. (And consumes multiple gigabytes of memory.)

3. Run `yarn build` to load the new mapping into the SQLite database used at runtime.
