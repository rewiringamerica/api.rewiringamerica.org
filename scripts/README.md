# Script Documentation and Usage

## Incentive Admin data update

To update API incentive data to reflect the data changes available in our Incentive Admin tool you may trigger the [Manual API Data Update](https://github.com/rewiringamerica/api.rewiringamerica.org/actions/workflows/import.yml) workflow.
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/7eb18edb-481a-4c72-b11a-8731100fddc8">

- Click run workflow and choose branch `main`.
- The workflow integration will pull the latest changes and open up a PR with those changes present.
- The PR must be approved by the RA team and released before changes are live.

## Utility Data

`generate-utility-data.ts` reads a [dataset](https://downloads.energystar.gov/bi/portfolio-manager/Public_Utility_Map_en_US.xlsx) published by ENERGY STAR to create a mapping from ZIP codes to utilities. It writes to a CSV file in `scripts/data`, which is then imported into the SQLite database by `build.sh`. It also writes every state's utilities (utility IDs and names) into that state's `authorities.json`. This data is used in the `/api/v1/utilities` endpoint.

The script has no required arguments. It downloads the data file from ENERGY STAR by default; you can pass `--file <file>` to have it read a local file instead (useful when iterating on data cleanup).

If you need to add a logo for a utility, add it manually in `authorities.json`; the script will leave it alone.

The script should be run, and the resulting file changes committed, any time the underlying dataset is updated (which we have to notice manually), and any time the script is updated.

The file `scripts/lib/utility-data-overrides.ts` defines a set of "exclusions" and "overrides", which patch the utility data in the underlying dataset to suit our needs. Exclusions are generally for utilities that don't provide electricity. Overrides are for changing utility names to be more in line with our needs -- fixing old names, consolidating different names for the same utility, using customer-facing brands, etc.

When adding support for a new state, you should vet and clean up the utility data we have for that state, using this process:

1. After running the script once, look at the list of utilities in your state's authorities.json. For each one, try to determine:

   - Does the utility provide electricity? If not, exclude them (see below).
   - Does the utility have a different customer-facing name? (E.g. the data tends to name municipal utilities as `City of XYZ`, but they often brand themselves as `XYZ Public Utilities` or similar.) If so, add an override (see below). We prefer to use the name that's at the top of their website / in their logo.
   - Are there multiple rows that seem to refer to the same utility? (E.g. the data is inconsistent about abbreviations, like `XYZ Rural Electric Cooperative` and `XYZ R E C`.) If so, override one or all to the customer-facing name, preferring to spell out abbreviations.

   Do some quick googling to answer these questions. Especially for small utilities, make sure they're in the right state; there are a lot of similarly-named municipal utilities across the country.

2. To exclude or override a utility:

   1. Find a row for the utility in the spreadsheet. The quickest way to do this is to query SQLite for one of the ZIP codes it's associated with:

   ```sql
   select min(zip) from zip_to_utility where utility_id = '<utility id>'
   ```

   Then find that ZIP in the sheet (the rows are sorted by ZIP).

   Alternatively, you can query for a sample ZIP for every utility in a state (replace `ct` with the abbreviation for whatever state you're working on):

   ```sql
   select utility_id, min(zip) from zip_to_utility
   where utility_id like 'ct-%'
   group by 1 order by 1;
   ```

   2. If there's a numeric Utility Code, then either:
      - Exclude it by adding the utility code to `EXCLUSIONS` in `scripts/lib/utility-data-overrides.ts`, under the appropriate state, with a brief comment about what the utility is and why you're excluding it.
      - Override its name by adding a pair with the utility code and the new name to `OVERRIDES`, under the appropriate state. The new name will be treated as if it came from the "Utility Name" column.
   3. If there's no numeric Utility Code (i.e. it says `Not Available` in that column), then do the step above but with the Utility Name from the spreadsheet instead.

3. As you add exclusions and overrides, rerun the script (`ts-node scripts/generate-utility-data.ts`) and `yarn build` to reflect your changes in the CSVs and SQLite.
4. When all the cleanup is done, make sure the set of utilities in the state's `authorities.json` is a subset of the utility IDs in SQLite. (There is a test for this: `test/data/utilities.test.ts`.)

## ny-empower-income-limits.ts

This script generates the low-income thresholds for New York's EmPower+ program. The income thresholds are expressed in a JavaScript variable on the program's "eligibility calculator" page. Paste that variable into the script and rerun it to regenerate the thresholds JSON.
