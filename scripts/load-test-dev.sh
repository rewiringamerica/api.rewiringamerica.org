#!/bin/sh

# we're only load-testing zip queries at the moment, this doesn't cost us anything so do 10000
# note that dev concurrency per cloud run instance is currently set to 80
# note that ab expects every response to be identical, so we're not sending varying URLs here
# ab -n 10000 -c 80 "https://incentives-api-dev-mcifvvqcxa-uc.a.run.app/api/v0/calculator?zip=80212&owner_status=homeowner&household_income=60000&tax_filing=single&household_size=4"
# note: try -k to enable keepalive, which would be more like what a high traffic API client would do (instead of individuals)
ab -n 10000 -c 80 "https://incentives-api-dev-mcifvvqcxa-uc.a.run.app/api/v1/calculator?location\[zip\]=80212&owner_status=homeowner&household_income=60000&tax_filing=single&household_size=4"
