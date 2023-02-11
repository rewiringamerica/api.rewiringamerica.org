#!/bin/sh

set -e

# if we're running locally, we want to clean out the old db:
rm -rf incentives-api.db

# on alpine linux, wget doesn't seem to support -N so check if the file exists first:
# this saves us from downloading it every build on macos, but lets us use the same
# script in Docker and local dev:
if [ ! -f Fair_Market_Rents.zip ]; then
  wget https://storage.googleapis.com/rewiring-america-api-data/Fair_Market_Rents.zip
fi

unzip -o -q Fair_Market_Rents.zip
ogr2ogr -f SQLite -append incentives-api.db Fair_Market_Rents/FAIR_MARKET_RENTS.shp -nln hud_fmr -nlt PROMOTE_TO_MULTI -dsco SPATIALITE=YES
rm -rf Fair_Market_Rents # data/Fair_Market_Rents.zip

sqlite3 incentives-api.db < scripts/import-csvs.sql
