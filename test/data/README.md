# Data Test README

## spreadsheets-health.test.ts

The main test in this file ensures that registered spreadsheets are in sync with data that's checked in. This allows us to have spreadsheets that don't incur significant tech debt every time we need to convert them to JSON (or vice versa).

The easiest mental model for what the test is doing is making sure the spreadsheet and JSON data are the same.

More specifically every row in a registered spreadsheet must be in sync with checked-in JSON records in the repo. A row can:

1. fail CollectedIncentive validation. This means it doesn't even meet our schema for collected data in spreadsheet form. These go in the `incentives_invalid_collected.json` file for that state.
2. fail StateIncentive validation. These records are valid spreadsheet records but something is failing in the process of converting them to servable JSON. These go in the `incentives_invalid_state.json` file for that state.
3. be valid, servable JSON. These go in the `incentives.json` file for that state.

Eventually, we'd want all spreadsheet records go in category #3, but we're not there yet. In the meantime, categories #1 and #2 are for meeting the spreadsheets as they are and making sure they don't get worse (worse meaning more out of sync from our schemas and data).

### Registering a state and fixing failures the first time

To add a new state, flip the `runSpreadsheetHealthCheck` boolean in `scripts/incentive-spreadsheet-registry.ts` to true. Then run the test. It'll almost certainly fail.

Assuming it does, run the `incentive-spreadsheet-to-json.ts` script (documented in `scripts/README.md`) to overwrite the existing JSON files, and then look at the diffs to see what needs to be changed. A diff means the spreadsheet and checked-in data are out of sync, and since the checked-in data is automated downstream processing of the spreadsheet, it's likely the spreadsheet that needs to be updated.

Our goal is that converting collected spreadsheet data into JSON is automatable, so if something is failing, it is a problem we eventually need to solve. If there are records in categories #1 or #2 above, spend some time trying to fix the issues by looking at the `errors` field in those files. Updating the spreadsheet or occasionally the codebase to fix errors is preferable to checking in the invalid record.

Sometimes, you might find records that are in the spreadsheets but not in the JSON because they're really far away from being convertable – perhaps they're an Item type that we don't know how to capture, or something that we're far away from being able to model. In that case, you can leave it in those files; just check them in. They're now clearly documented gaps in our data processing pipeline.

There are a lot of potential reasons for diffs in the valid JSON:

- if whole spreadsheet records are being added to JSON, ensure that's a good idea. If they were left out because there wasn't an appropriate Item at the time, but there is now, it could be reasonable to add them. But there may be good editorial reasons to leave them out even if they are valid.
- Wordsmith-ing or minor changes might have been made to the JSON and never propagated back to the spreadsheets. This is understandable, but we don't want this in the future.
- Authorities or programs are commonly renamed, because our rules for converting authority or program names into string identifiers has changed over time. You might need to go back one step easlier and re-run the _entire_ spreadsheet-to-json flow, starting with `generate-misc-state-data.ts` (again, see the `scripts/README.md`). In particular, we now actually require utility Authorities to appear in the utilities database, meaning that some of the Authority Names in the spreadsheet are wrong.

There are some known pain points where our automation isn't good enough. Low-income thresholds don't work well now when the threshold is the state's default. You'll probably need to manually correct some records each time you re-run the flow. This is a known issue.

### Fixing failures after a state has already been registered

Hopefully you'll have more minor changes to deal with in this scenario relative to the above, and they may not even be your fault, but you still have to fix the issues.

As above, rerun the spreadsheet-to-json flow, starting with the `incentive-spreadsheet-to-json.ts`. Look at the diffs and see what's going on.

You should almost never _add_ error rows – that means you are increasing the distance between the spreadsheets and what's checked in. Similarly, you should almost never move rows from category #3 to #2, or #2 to #1 – that represents data regression.

See the tips above. Usually, someone changed a spreadsheet and didn't update the data, or vice versa. See whichever version seems more recent/authoritative and make them agree.
