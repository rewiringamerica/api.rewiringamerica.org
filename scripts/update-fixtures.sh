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
?zip=84106\
&owner_status=homeowner\
&household_income=80000\
&tax_filing=joint\
&household_size=4" \
  | jq . > test/fixtures/v1-84106-homeowner-80000-joint-4.json

curl \
  "http://localhost:3000/api/v1/calculator\
?zip=02807\
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
?zip=02903\
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
?zip=85701\
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
?zip=85702\
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
?zip=06002\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=35000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=ct-eversource" \
  | jq . > test/fixtures/v1-ct-06002-state-utility-lowincome.json

# TODO: Remove beta states argument when GA is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?zip=30033\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=40000\
&tax_filing=joint\
&household_size=1\
&authority_types=utility\
&utility=ga-georgia-power" \
  | jq . > test/fixtures/v1-ga-30033-utility.json

curl \
  "http://localhost:3000/api/v1/calculator?\
zip=60304\
&owner_status=homeowner\
&household_income=35000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority=il-state-of-illinois" \
 | jq . > test/fixtures/il-60304-state-utility-lowincome.json

 curl \
  "http://localhost:3000/api/v1/calculator?\
zip=60202\
&owner_status=homeowner\
&household_income=10000\
&tax_filing=single\
&household_size=2\
&authority_types=city" \
 | jq . > test/fixtures/v1-il-60202-city-lowincome.json

# TODO: Remove beta states argument when MI is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?zip=48103\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=40000\
&tax_filing=joint\
&household_size=1\
&authority_types=utility\
&utility=mi-dte" \
  | jq . > test/fixtures/v1-mi-48103-state-utility-lowincome.json

# TODO: Remove beta states argument when MI is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?zip=48825\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=10000\
&tax_filing=single\
&household_size=2\
&authority_types=utility\
&utility=mi-lansing-board-of-water-and-light" \
  | jq . > test/fixtures/v1-mi-48825-city-lowincome.json

curl \
  "http://localhost:3000/api/v1/calculator\
?zip=89108\
&owner_status=homeowner\
&household_income=40000\
&tax_filing=joint\
&household_size=1\
&authority_types=utility\
&utility=nv-nv-energy" \
  | jq . > test/fixtures/v1-nv-89108-state-utility-lowincome.json

# TODO: Remove &include_beta_states when NY is launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?zip=11557\
&owner_status=homeowner\
&household_income=50000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=ny-pseg-long-island\
&include_beta_states=true" \
  | jq . > test/fixtures/v1-ny-11557-state-utility-lowincome.json

curl \
  "http://localhost:3000/api/v1/calculator?\
zip=17555\
&owner_status=homeowner\
&household_income=20000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&authority_types=other\
&utility=pa-met-ed" \
 | jq . > test/fixtures/v1-pa-17555-state-lowincome.json

# TODO: Remove beta states argument when VA is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?zip=22030\
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
?zip=05401\
&owner_status=homeowner\
&household_income=40000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&utility=vt-burlington-electric-department" \
  | jq . > test/fixtures/v1-vt-05401-state-utility-lowincome.json

curl \
  "http://localhost:3000/api/v1/calculator\
?zip=05845\
&owner_status=homeowner\
&household_income=40000\
&tax_filing=single\
&household_size=1\
&items=new_electric_vehicle\
&items=used_electric_vehicle\
&utility=vt-vermont-electric-cooperative" \
  | jq . > test/fixtures/v1-vt-05845-vec-ev-low-income.json

# TODO: Remove beta states argument when CO is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator\
?zip=81657\
&owner_status=homeowner\
&household_income=100000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&authority_types=other\
&utility=co-xcel-energy" \
  | jq . > test/fixtures/v1-co-81657-state-utility-lowincome.json

curl \
  "http://localhost:3000/api/v1/calculator\
?zip=15289\
&owner_status=homeowner\
&household_income=85000\
&tax_filing=joint\
&household_size=4" \
  | jq . > test/fixtures/v1-15289-homeowner-85000-joint-4.json

curl \
  "http://localhost:3000/api/v1/calculator\
?zip=20303\
&owner_status=homeowner\
&household_income=95796\
&tax_filing=joint\
&household_size=4\
&authority_types=state\
&authority_types=city" \
  | jq . > test/fixtures/v1-dc-20303-state-city-lowincome.json

curl \
  "http://localhost:3000/api/v1/calculator\
?zip=80517\
&owner_status=homeowner\
&household_income=80000\
&tax_filing=single\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&authority_types=other\
&items=heat_pump_water_heater\
&utility=co-xcel-energy" \
  | jq . > test/fixtures/v1-80517-xcel.json

curl \
  "http://localhost:3000/api/v1/calculator\
?zip=80517\
&owner_status=homeowner\
&household_income=80000\
&tax_filing=single\
&household_size=1\
&authority_types=state\
&authority_types=utility\
&authority_types=other\
&items=heat_pump_water_heater\
&utility=co-estes-park-power-and-communications" \
  | jq . > test/fixtures/v1-80517-estes-park.json

# TODO: Remove beta states argument when WI is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator?\
zip=53703\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=50000\
&tax_filing=joint\
&household_size=1\
&authority_types=state\
&authority_types=other\
&utility=wi-madison-gas-and-electric"\
 | jq . > test/fixtures/v1-wi-53703-state-utility-lowincome.json

# TODO: Remove beta states argument when OR is fully launched.
curl \
  "http://localhost:3000/api/v1/calculator?\
zip=97001\
&include_beta_states=true\
&owner_status=homeowner\
&household_income=50000\
&tax_filing=joint\
&household_size=1\
&authority_types=state"\
 | jq . > test/fixtures/v1-or-97001-state-lowincome.json
