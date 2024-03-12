/*
for (const filename of process.argv.slice(2)) {
  const contents = JSON.parse(fs.readFileSync(filename, 'utf-8'));

  for (const incentive of contents) {
    if (incentive.start_date) {
      incentive.start_date = incentive.start_date.toString();
    }
    if (incentive.end_date) {
      incentive.end_date = incentive.end_date.toString();
    }
  }

  fs.writeFileSync(filename, JSON.stringify(contents, null, 2) + '\n');
}
*/
