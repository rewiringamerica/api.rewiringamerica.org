import fs from 'fs';
import path from 'path';

(async function () {
  // @ts-ignore (sorry, gross: fetch isn't known to ts-node but it is there!)
  const response = await fetch(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoBQdIvYNb9fRkFggllmLZmz9nwL6SYxM7cdsiTPDU90C0HXtFh2r1qlYKdfbTzzxiPZ0o4NpOva__/pub?gid=30198531&single=true&output=tsv',
  );
  const body = await response.text();

  // TODO: probably use a real CSV parser here:
  const lines: string[] = body.split('\n');

  // First row is a header of headers, so ignore it:
  const [_, headers, ...rows] = lines.map(line => line.split('\t'));

  // We only care about these columns at the moment:
  var columnsWeWant = ['ID', 'Program Description (style guide)'];

  // Get an array of the indexes for those columns:
  var indexesWeWant = headers
    .map((header, index) => {
      return {
        header,
        index,
      };
    })
    .filter(({ header }) => columnsWeWant.includes(header))
    .map(item => item.index);

  // build a map from ID => description:
  const descriptionsById = new Map<string, string>();
  rows.forEach(row => {
    const [id, description] = indexesWeWant.map(index => row[index]);
    if (description.trim()) {
      descriptionsById.set(id, description.trim());
    }
  });

  type Incentive = {
    id: string;
    short_description: string;
  };

  // loop over all known RI incentives and apply edits if needed, logging either way:
  const riData: Incentive[] = require('../data/RI/incentives.json');

  riData.forEach(incentive => {
    if (descriptionsById.has(incentive.id)) {
      const spreadsheetDescription = descriptionsById.get(incentive.id)!;
      if (incentive.short_description !== spreadsheetDescription) {
        console.log(
          `✏️ ${incentive.id}: "${incentive.short_description}" --> "${spreadsheetDescription}"`,
        );
        incentive.short_description = spreadsheetDescription;
      } else {
        console.log(`✔ ${incentive.id}: no edits needed.`);
      }
    } else {
      console.log(`✘ ${incentive.id}: not in spreadsheet, consider removing?`);
    }
  });

  // if requested, write that file back out:
  if (process.argv.includes('--write')) {
    const incentivePath = path.join(__dirname, '../data/RI/incentives.json');
    fs.writeFileSync(incentivePath, JSON.stringify(riData, null, 2), 'utf-8');
  }
})();