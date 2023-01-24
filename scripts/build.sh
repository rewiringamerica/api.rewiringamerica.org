#!/bin/sh

rm -rf incentives-api.db

unzip -o -q data/Fair_Market_Rents.zip
ogr2ogr -f SQLite -append incentives-api.db Fair_Market_Rents/Fair_Market_Rents.shp -nln hud_fmr -nlt PROMOTE_TO_MULTI -dsco SPATIALITE=YES
rm -rf Fair_Market_Rents

sqlite3 incentives-api.db < scripts/import-csvs.sql
