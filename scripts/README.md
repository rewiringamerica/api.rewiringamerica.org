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

There are two scripts involved. Before you use either, register the state in [incentive-spreadsheet-registry.ts](incentive-spreadsheet-registry.ts).

1. `generate-misc-state-data.ts` adds values to ancillary files to reflect the programs and authorities that will be needed for the JSON. This needs to happen first because our data schemas actually require an incentive's program/authority to be one of the listed members, and if that's not the case, the incentive will fail validation.

This script covers:
data/authorities.json
data/programs.ts
src/data/programs.ts

After running, you may need to edit these files to put states in alphabetical order. Note that running this script twice will paste the same values twice.

Usage:
`node build/scripts/generate-misc-state-data.js <state_id>`

1. `incentive-spreadsheet-to-json.js` reads the spreadsheet and tries to convert it to JSON. This can be a messy process – spreadsheets may not have the correct column names or values. The script tries to handle small string discrepancies itself because making edits to Google sheets has a 5-minute delay before changes are reflected, but ultimately even with the script's help, this may be a painstaking process.

Make a state directory under `/data` to store the JSON if not already done, then:

Usage:
`node build/scripts/incentive-spreadsheet-to-json.js --strict CO`

`--strict` is recommended since it will throw an error for any misnamed columns. You can correct these or errors in cell values by remapping them: use the [spreadsheet-mappings](lib/spreadsheet-mappings.ts) file.

All valid records according to our schema will be written to the location you specified in the [incentive-spreadsheet-registry.ts](incentive-spreadsheet-registry.ts). Invalid records will be in an adjacent file with the suffix `_invalid.json`. There should be a rationale for the invalidation in the `errors` key to help you fix it. It may require multiple passes to get all JSON records produced.

Note that even after running these, there are still files you must edit manually to get the JSON in. Follow a recent CL example.
Eg: https://github.com/rewiringamerica/api.rewiringamerica.org/pull/209/files
