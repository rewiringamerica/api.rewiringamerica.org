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

## spreadsheets-health.test.ts

The main test in this file ensures that registered spreadsheets are in sync with data that's checked in. This allows us to have spreadsheets that don't incur significant tech debt every time we need to convert them to JSON (or vice versa).

The easiest mental model for what the test is doing is making sure the spreadsheet and JSON data are the same.

More specifically every row in a registered spreadsheet must be in sync with checked-in JSON records in the repo. A row can:

1. fail CollectedIncentive validation. This means it doesn't even meet our schema for collected data in spreadsheet form. These go in the `incentives_invalid_collected.json` file for that state.
2. fail StateIncentive validation. These records are valid spreadsheet records but something is failing in the process of converting them to servable JSON. These go in the `incentives_invalid_state.json` file for that state.
3. be valid, servable JSON. These go in the `incentives.json` file for that state.

Eventually, we'd want all spreadsheet records go in category #3, but we're not there yet. In the meantime, categories #1 and #2 are for meeting the spreadsheets as they are and making sure they don't get worse (worse meaning more out of sync from our schemas and data).

### Registering a state and fixing failures the first time

To add a new state, set the `runSpreadsheetHealthCheck` boolean in `scripts/incentive-spreadsheet-registry.ts` to true. Then run the test. It'll almost certainly fail.

Assuming it does, the easiest way to resolve any diffs is to run the `incentive-spreadsheet-to-json.ts` script (documented in `scripts/README.md`) to overwrite the existing JSON files, and then look at the diffs to see what needs to be changed. A diff means the spreadsheet and checked-in data are out of sync – see potential reasons for diffs below.

Our goal is that converting collected spreadsheet data into JSON is automatable, so if something is failing, it is a problem we eventually need to solve. If there are records in categories #1 or #2 above, spend some time trying to fix the issues by looking at the `errors` field in those files. Updating the spreadsheet or occasionally the codebase to fix errors is preferable to checking in the invalid record.

Sometimes, you might find records that are in the spreadsheets but not in the JSON because they're really far away from being convertable – perhaps they're an Item type that we don't know how to capture, or something that we're far away from being able to model. In that case, you can leave it in those files; just check them in. They're now clearly documented gaps in our data processing pipeline.

There are a lot of potential reasons for diffs in the valid JSON:

- someone may have added or subtracted rows in the spreadsheet, in which case you should expect whole records to be added or removed from the JSON. It could also be that those records were always in the spreadsheet, but when the JSON conversion process was manual, someone left them out intentionally for editorial reasons. You can use the `Omit from API?` column in the spreadsheet to ignore records if you don't want them to be served by the API.
- Wordsmith-ing or minor changes might have been made to the JSON and never propagated back to the spreadsheets. This is understandable, but we don't want this in the future.
- Authorities or programs are commonly renamed, because our rules for converting authority or program names into string identifiers has changed over time. You might need to go back one step easlier and re-run the _entire_ spreadsheet-to-json flow, starting with `generate-misc-state-data.ts` (again, see the `scripts/README.md`). In particular, we now actually require utility Authorities to appear in the utilities database, meaning that some of the Authority Names in the spreadsheet are wrong.

There are some known pain points where our automation isn't good enough. Low-income thresholds don't work well now when the threshold is the state's default ([Asana](https://app.asana.com/0/0/1206728986903186/f)). You may need to manually correct some records each time you re-run the flow. One workaround is to set a default threshold (since the schema requires it), but don't use it and always create thresholds explicitly tied to an authority.

### Fixing failures after a state has already been registered

Hopefully you'll have more minor changes to deal with in this scenario relative to the above, and they may not even be your fault, but you still have to fix the issues.

As above, rerun the spreadsheet-to-json flow, starting with the `incentive-spreadsheet-to-json.ts`. Look at the diffs and see what's going on.

You should almost never _add_ error rows – that means you are increasing the distance between the spreadsheets and what's checked in. Similarly, you should almost never move rows from category #3 to #2, or #2 to #1 above – that represents data regression.

See the tips above. Usually, someone changed a spreadsheet and didn't update the data, or vice versa. See whichever version seems more recent/authoritative and make them agree.
