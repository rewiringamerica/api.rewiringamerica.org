import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { afterEach, beforeEach, test } from 'tap';
import fetchAMIsForAddress from '../../src/lib/fetch-amis-for-address';
import { geocoder } from '../../src/lib/geocoder';
import { geocoder as mockGeocoder } from '../mocks/geocoder';

beforeEach(async t => {
  t.context.db = await open({
    filename: './incentives-api.db',
    driver: sqlite3.Database,
  });
  t.context.oldGeocode = geocoder.geocode;
  geocoder.geocode = function (query: string, fields: string[]) {
    return mockGeocoder.geocode(query, fields);
  };
});

afterEach(async t => {
  geocoder.geocode = t.context.oldGeocode;
  await t.context.db.close();
});

test('finds the correct census tracts, ami and location info', async t => {
  // this is an address firmly inside 2010 census tract 08031000201 from Treasury's NMTC excel file
  const amisForAddress = await fetchAMIsForAddress(
    t.context.db,
    '4986 Zuni St, Denver, CO 80221',
  );
  t.ok(amisForAddress);
});
