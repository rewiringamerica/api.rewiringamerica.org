# Script Documentation and Usage

## Incentive Admin data update

To update API incentive data to reflect the data changes available in our Incentive Admin tool you may trigger the [Manual API Data Update](https://github.com/rewiringamerica/api.rewiringamerica.org/actions/workflows/import.yml) workflow.
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/7eb18edb-481a-4c72-b11a-8731100fddc8">

- Click run workflow and choose branch `main`.
- The workflow integration will pull the latest changes and open up a PR with those changes present.
- The PR must be approved by the RA team and released before changes are live.

## ny-empower-income-limits.ts

This script generates the low-income thresholds for New York's EmPower+ program. The income thresholds are expressed in a JavaScript variable on the program's "eligibility calculator" page. Paste that variable into the script and rerun it to regenerate the thresholds JSON.
