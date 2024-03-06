# Script Documentation and Usage

## Automated description updates

The script `scripts/update-descriptions.ts` fetches short descriptions for incentives from our internal spreadsheets, and writes them to the corresponding JSON files. Spreadsheet rows and JSON incentives are correlated by ID. Update the script whenever new states/spreadsheets are added. (We aim to eventually generate entire incentives JSON files like this, not just the `short_description` field.)

The script is also runnable as `yarn update-descriptions`. Pass two-letter state codes, or `IRA`, as arguments to the script. By default, the script only shows a diff and does not modify the files; pass `--write` to apply edits.

## GPT/LLM Pass at Spanish Translations

This script uses the OpenAI API to create a first pass at translations of short_descriptions from English to Spanish. It primes the LLM with domain-specific vocabulary.

Use once the final English version is already available in a JSON file in `/data` and registered in [incentive-spreadsheet-registry.ts](incentive-spreadsheet-registry.ts). See pre-work in the script, which includes getting an API key.

Usage:

```
node build/scripts/generate-spanish-descriptions.js <state_id>
```

This will print translations to the console.

## Spreadsheet to JSON

This workflow takes a Google spreadsheet where initial spreadsheet data has been collected and converts it to the JSON format we use for our incentives.

There are two scripts involved. Before you use either, register the state in [`incentive-spreadsheet-registry.ts`](incentive-spreadsheet-registry.ts).

Filling out an entry for `incentive-spreadsheet-registry.ts` consists of creating a new key with the state abbreviation, and then:

- Creating a filepath where incentive data will be written in `filepath`
- Exporting and sharing a sheet URL in `sheetUrl`
  - To do this for a Google sheet, click File -> Share -> Publish to web and under `Link`, select the Incentives data tab and change the `Web page` default to `Comma separated values (.csv)`. The link that appears is what should be copied into the value.
- Optionally declaring the header row number, if not the top row of the spreadsheet, in `headerRowNumber`

[`generate-misc-state-data.ts`](generate-misc-state-data.ts) adds values to ancillary files to reflect the programs and authorities that will be needed for the JSON. This needs to happen first because our data schemas actually require an incentive's program/authority to be one of the listed members, and if that's not the case, the incentive will fail validation.

This script covers:

- data/authorities.json
- data/programs.ts
- src/data/programs.ts

Usage:
`node build/scripts/generate-misc-state-data.js <state_id>`

After running, you may need to edit the program files to put states in alphabetical order. The authorities file is already alphabetically sorted. Note that running this script twice will paste the same values twice.

It's recommended to also define low-income thresholds in `data/low_income_thresholds.json` for your state to save time in the next step.

1. [`incentive-spreadsheet-to-json.ts`](incentive-spreadsheet-to-json.ts) reads the spreadsheet and tries to convert it to JSON. This can be a messy process – spreadsheets may not have the correct column names or values. The script tries to handle small string discrepancies itself because making edits to Google sheets has a 5-minute delay before changes are reflected, but ultimately even with the script's help, this may be a painstaking process.

Usage:
`node build/scripts/incentive-spreadsheet-to-json.js --strict CO`

`--strict` is recommended since it will throw an error for any misnamed columns. You can correct these or errors in cell values by remapping them: use the [spreadsheet-mappings](lib/spreadsheet-mappings.ts) file.

All valid records according to our schema will be written to the location you specified in the [incentive-spreadsheet-registry.ts](incentive-spreadsheet-registry.ts). Invalid records will be in an adjacent file with the suffix `_invalid.json`. There should be a rationale for the invalidation in the `errors` key to help you fix it. It may require multiple passes to get all JSON records produced.

Note that even after running these, there are still files you must edit manually to get the JSON in. Follow a recent CL example.
Eg: https://github.com/rewiringamerica/api.rewiringamerica.org/pull/209/files

## Utility Data

`generate-utility-data.ts` reads a [dataset](https://downloads.energystar.gov/bi/portfolio-manager/Public_Utility_Map_en_US.xlsx) published by ENERGY STAR to create a mapping from ZIP codes to utilities. It writes to two CSV files in `scripts/data`, which are then imported into the SQLite database by `build.sh`. This data is used in the `/api/v1/utilities` endpoint.

The script has no required arguments. It downloads the data file from ENERGY STAR by default; you can pass `--file <file>` to have it read a local file instead (useful when testing).

The script should be run, and the changes to the CSV files committed, any time the underlying dataset is updated (which we have to notice manually), and any time the script is updated.

At the top, the script defines a set of "exclusions" and "overrides", which patch the utility data in the underlying dataset to suit our needs. Exclusions are generally for utilities that don't provide electricity. Overrides are for changing utility names to be more in line with our needs -- fixing old names, consolidating different names for the same utility, using customer-facing brands, etc.

When adding support for a new state, you should vet and clean up the utility data we have for that state, using this process:

1. Run SQLite on the database and run:
   ```sql
   select utility_id, name, min(zip)
   from zip_to_utility
   natural join utilities
   where utility_id like 'ca-%'
   group by 1, 2;
   ```
   (Replace `ca` with the abbreviation for the state you're working on)
2. For each row, try to determine:

   - Does the utility provide electricity? If not, exclude them (see below).
   - Does the utility have a different customer-facing name? (E.g. the data tends to name municipal utilities as `City of XYZ`, but they often brand themselves as `XYZ Public Utilities` or similar.) If so, add an override (see below). We prefer to use the name that's at the top of their website / in their logo.
   - Are there multiple rows that seem to refer to the same utility? (E.g. the data is inconsistent about abbreviations, like `XYZ Rural Electric Cooperative` and `XYZ R E C`.) If so, override one or all to the customer-facing name, preferring to spell out abbreviations.

   Do some quick googling to answer these questions. Especially for small utilities, make sure they're in the right state; there are a lot of similarly-named municipal utilities across the country.

3. To exclude or override a utility:
   1. Find a row for the utility in the spreadsheet, using the ZIP that came up for the utility in the SQL query. (This is the quickest way to find rows in the sheet.)
   2. If there's a numeric Utility Code, then either:
      - Exclude it by adding the utility code to `EXCLUSIONS`, under the appropriate state, with a brief comment about what the utility is and why you're excluding it.
      - Override its name by adding a pair with the utility code and the new name to `OVERRIDES`, under the appropriate state. The new name will be treated as if it came from the "Utility Name" column.
   3. If there's no numeric Utility Code (i.e. it says `Not Available` in that column), then do the step above but with the Utility Name from the spreadsheet instead.
4. As you add exclusions and overrides, rerun the script and `yarn build` to reflect your changes in the CSVs and SQLite.
5. When all the cleanup is done, make sure the set of utilities for the state in `authorities.json` is a subset of the utility IDs in SQLite. (There is a test for this.)
