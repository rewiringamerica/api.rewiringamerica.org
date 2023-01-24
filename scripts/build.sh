#!/bin/sh

rm -rf incentives-api.db

sqlite3 incentives-api.db < scripts/import-csvs.sql
