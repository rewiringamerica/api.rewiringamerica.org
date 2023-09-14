#!/bin/bash

# Must have jq installed:
#   brew install jq

curl \
  "http://localhost:3000/api/v0/calculator\
?zip=80212\
&owner_status=homeowner\
&household_income=80000\
&tax_filing=joint\
&household_size=4" \
  | jq . > test/fixtures/v0-80212-homeowner-80000-joint-4.json

curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=80212\
&owner_status=homeowner\
&household_income=80000\
&tax_filing=joint\
&household_size=4" \
  | jq . > test/fixtures/v1-80212-homeowner-80000-joint-4.json

curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=02807\
&owner_status=homeowner\
&household_income=65000\
&tax_filing=joint\
&household_size=4\
&authority_types=state\
&authority_types=federal\
&items=heat_pump_air_conditioner_heater\
&items=new_electric_vehicle" \
  | jq . > test/fixtures/v1-02807-state-items.json

curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=02903\
&owner_status=homeowner\
&household_income=65000\
&tax_filing=joint\
&household_size=4\
&authority_types=state\
&authority_types=utility\
&utility=ri-rhode-island-energy" \
  | jq . > test/fixtures/v1-02903-state-utility-lowincome.json
