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

# TODO: Remove beta states argument when AZ is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=85701\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=28000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=az-tucson-electric-power" \
  | jq . > test/fixtures/v1-az-85701-state-utility-lowincome.json

# TODO: Remove beta states argument when AZ is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=85702\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=28000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=az-uni-source-energy-services" \
  | jq . > test/fixtures/v1-az-85702-state-utility-lowincome.json

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

# TODO: Remove beta states argument when IL is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator?\
location%5Bzip%5D=60304\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=35000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority=il-state-of-illinois" \
 | jq . > test/fixtures/il-60304-state-utility-lowincome.json

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
&utility=va-dominion-energy" \
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

# TODO: Remove beta states argument when CO is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=81657\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=100000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=co-walking-mountains" \
  | jq . > test/fixtures/v1-co-81657-state-utility-lowincome.json

curl \
  "http://localhost:3000/api/v1/calculator\
?location\[zip\]=15289\
&owner_status=homeowner\
&household_income=80000\
&tax_filing=joint\
&household_size=4" \
  | jq . > test/fixtures/v1-15289-homeowner-80000-joint-4.json

# TODO: Remove beta states argument when WI is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator?\
location%5Bzip%5D=53703\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=50000\
&tax_filing=joint\
&household_size=1" \
 | jq . > test/fixtures/v1-wi-53703-state-utility-lowincome.json
