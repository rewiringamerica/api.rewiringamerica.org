const fs = require('fs');

const programs = require('../data/programs.json');
const authorities = require('../data/authorities.json');

// TODO: use a real CSV library
// TODO: allow specifying the item to filter on

const headers = [
  'id',
  'state',
  'authority_type',
  'authority',
  'payment_methods',
  'item',
  'program_name',
  'program_url',
  'amount_type',
  'amount_number',
  'amount_maximum',
  'owner_status',
  'short_description',
  'start_date',
  'end_date',
];

const rows = fs
  .readdirSync('./data')
  .filter((d: string) => d.length === 2)
  .map((d: string) => require(`../data/${d}/incentives.json`))
  .flat()
  .filter((i: any) => i.item === 'heat_pump_water_heater')
  .map((i: any) => {
    const state = i.id.split('-')[0];
    return [
      i.id,
      state,
      i.authority_type,
      authorities[state][i.authority_type][i.authority].name,
      i.payment_methods[0],
      i.item,
      `"${programs[i.program].name.en}"`,
      `"${programs[i.program].url.en}"`,
      i.amount.type,
      i.amount.number,
      i.amount.maximum,
      i.owner_status.join('/'),
      `"${i.short_description.en}"`,
      i.start_date,
      i.end_date,
    ].join(',');
  });

fs.writeFileSync('./data.csv', [headers, ...rows].join('\n'), 'utf-8');
