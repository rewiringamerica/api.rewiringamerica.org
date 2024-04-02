# Script Documentation and Usage

## Automated description updates

Note: when possible, prefer using the full [Spreadsheet to JSON](#spreadsheet-to-json) process documented below. You may still need this script if many other values between the spreadsheet and JSON would be changed, or if you want to update the IRA fields.

The script `scripts/update-descriptions.ts` fetches short descriptions for incentives from our internal spreadsheets, and writes them to the corresponding JSON files. Spreadsheet rows and JSON incentives are correlated by ID. Update the script whenever new states/spreadsheets are added.

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

There are three scripts involved. Before you use them, register the state in [`incentive-spreadsheet-registry.ts`](incentive-spreadsheet-registry.ts).

Filling out an entry for `incentive-spreadsheet-registry.ts` consists of creating a new key with the state abbreviation, and then:

- Creating a filepath where incentive data will be written in `filepath`
- Exporting and sharing a sheet URL in `sheetUrl`
  - To do this for a Google sheet, click File -> Share -> Publish to web and under `Link`, select the Incentives data tab and change the `Web page` default to `Comma separated values (.csv)`. The link that appears is what should be copied into the value.
- Optionally declaring the header row number, if not the top row of the spreadsheet, in `headerRowNumber`
- Optionally naming a filepath where _collected_ incentives will be written in `collectedFilepath`. We recommend using `data/<state_id>/collected.json`. This is experimental and also requires some setup to authenticate with the Google API. See [JSON To Spreadsheet](#json-to-spreadsheet) for more details before proceeding.

First, create a subdirectory in `data/` named with the new state's abbreviation.

Then, run [`generate-utility-data.ts`](generate-utility-data.ts) to populate the list of utilities in the state's authorities.json file. See [below](#utility-data) for details on that.

[`generate-misc-state-data.ts`](generate-misc-state-data.ts) adds values to ancillary files to reflect the programs and authorities that will be needed for the JSON. This needs to happen first because our data schemas actually require an incentive's program/authority to be one of the listed members, and if that's not the case, the incentive will fail validation.

This script covers:

- data/authorities.json
- src/data/programs.ts

Usage:
`node build/scripts/generate-misc-state-data.js <state_id>`

It's recommended to also define low-income thresholds in `data/low_income_thresholds.json` and geo groups in `data/geo_groups.json` for your state to save time in the next step.

1. [`incentive-spreadsheet-to-json.ts`](incentive-spreadsheet-to-json.ts) reads the spreadsheet and tries to convert it to JSON. This can be a messy process – spreadsheets may not have the correct column names or values. The script tries to handle small string discrepancies itself because making edits to Google sheets has a 5-minute delay before changes are reflected, but ultimately even with the script's help, this may be a painstaking process.

Usage:
`node build/scripts/incentive-spreadsheet-to-json.js --strict CO`

`--strict` is recommended since it will throw an error for any misnamed columns. You can correct these or errors in cell values by remapping them: use the [spreadsheet-mappings](lib/spreadsheet-mappings.ts) file.

All valid records according to our schema will be written to the location you specified in the [incentive-spreadsheet-registry.ts](incentive-spreadsheet-registry.ts). Invalid records will be in an adjacent file with the suffix `_invalid.json`. There should be a rationale for the invalidation in the `errors` key to help you fix it. It may require multiple passes to get all JSON records produced.

Note that even after running these, there are still files you must edit manually to get the JSON in. Follow a recent CL example.
Eg: https://github.com/rewiringamerica/api.rewiringamerica.org/pull/209/files

To encode relationships between incentives, see the [`relationships-README`](https://github.com/rewiringamerica/api.rewiringamerica.org/blob/main/docs/relationships-README.md).

## JSON to Spreadsheet

This takes _CollectedIncentives_ and exports them back to a Google Sheet. Note that CollectedIncentive is a larger schema compared to StateIncentive; the latter is what is stored in the state `incentives.json` files and what we serve in the API. Conceptually, a CollectedIncentive is a JSON represeentation of a spreadsheet row.

### Setup

You'll need credentials to authenticate with the Google Sheets API, both for reading and writing. To do so, visit the [Google Cloud project](https://console.cloud.google.com/welcome?project=spreadsheet-json-conversion), specifically this [OAuth credential](https://console.cloud.google.com/apis/credentials/oauthclient/599066193537-oqjm5hffqfkknfethrm3od9pukeh45hh.apps.googleusercontent.com?project=spreadsheet-json-conversion). If you can't download the existing secret, add a new secret. Download that file and put it in `secrets/credentials.json`.

### Getting CollectedIncentives

Most states don't have their CollectedIncentives checked in, so we'll need to generate some first. Add a `collectedFilepath` field to your state in the [`incentive-spreadsheet-registry.ts`](incentive-spreadsheet-registry.ts). If you haven't already run the state through the [Spreadsheet to JSON](#spreadsheet-to-json) process, do so now, including the first steps with the `generate-utility-data.ts` and `generate-misc-state-data.ts` scripts.

When you get to the `incentive-spreadsheet-to-json.ts` script, if you've supplied the `collectedFilepath`, you will get a URL to your console indicating that you should visit it to continue the authentication process. Give permission from your Google Account and continue the process.

After this point, you should have a CollectedIncentives file located at the `collectedFilepath` you supplied. Ideally, we should check in this file and make it the source of truth, instead of the spreadsheets or the servable API data.

### Exporting to Google Sheets

Once you have your CollectedIncentives, run:

`yarn ts-node scripts/export-to-google-sheets.ts <state_id>`

You will get a URL printed to the console indicating that you've created a Google Sheet. Visit it and see that it is equivalent to the JSON data, and more-or-less equivalent to the original spreadsheet that you ran through the spreadsheet-to-json process. Some diffs you can expect:

1. Minor formatting changes
2. Links where the target URL isn't present in the text ([example](https://google.com)) are converted include the link target explicitly.
3. Some column or values names may change to be more canonical
4. Most non-text features won't survive the conversion (comments, filters, charts, etc.)

If you've made changes to the CollectedIncentives JSON and your exported spreadsheet is more up-to-date than the previous version of the spreadsheet, consider replacing it.

## Utility Data

`generate-utility-data.ts` reads a [dataset](https://downloads.energystar.gov/bi/portfolio-manager/Public_Utility_Map_en_US.xlsx) published by ENERGY STAR to create a mapping from ZIP codes to utilities. It writes to a CSV file in `scripts/data`, which is then imported into the SQLite database by `build.sh`. For any state with a subdirectory in `data`, it also modifies that state's `authorities.json` to include the utility IDs and names. This data is used in the `/api/v1/utilities` endpoint.

The script has no required arguments. It downloads the data file from ENERGY STAR by default; you can pass `--file <file>` to have it read a local file instead (useful when testing).

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

Sometimes, you might find records that are in the spreadsheets but not in the JSON because they're really far away from being convertable – perhaps they're an Item type that we don't know how to capture, or something that we're far away from being able to model. In that case, you can leave the generated invalid records in the state's `incentives_invalid_collected.json` or `incentives_invalid_state.json` files and check them in. They're now clearly documented gaps in our data processing pipeline.

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
