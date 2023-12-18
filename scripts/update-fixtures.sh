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

# TODO: Remove beta states argument when CT is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=06002\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=35000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=ct-eversource" \
  | jq . > test/fixtures/v1-ct-06002-state-utility-lowincome.json

# TODO: Remove &include_beta_states when NY is launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=11557\
&owner_status=homeowner\
&household_income=50000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=ny-pseg-long-island\
&include_beta_states=true" \
  | jq . > test/fixtures/v1-ny-11557-state-utility-lowincome.json

# TODO: Remove beta states argument when VA is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=22030\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=40000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=va-dominion-virginia-power" \
  | jq . > test/fixtures/v1-va-22030-state-utility-lowincome.json

curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=05401\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=40000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=vt-burlington-electric-department" \
  | jq . > test/fixtures/v1-vt-05401-state-utility-lowincome.json