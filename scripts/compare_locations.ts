import fs from 'fs';
import * as _ from 'lodash';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fetchAMIsForZip from '../src/lib/fetch-amis-for-zip';
import { CountySubInfo, IncomeInfo, PlaceInfo } from '../src/lib/income-info';

type CitySummary = { state_id?: string; city?: string; city_raw?: string };
function summarize(item: PlaceInfo | CountySubInfo): CitySummary {
  return {
    state_id: item.state_id,
    city: item.name.split(' ').slice(0, -1).join(' '),
    city_raw: item.name,
  };
}

function getComp(item: CitySummary): CitySummary {
  return {
    city: item!.city,
    state_id: item!.state_id,
  };
}

async function main(db: Database, count: number) {
  const zips = await db.all(
    `
    SELECT zip
    FROM zips
    WHERE zip IN (
      SELECT zip
      From zips 
      ORDER BY RANDOM() LIMIT ?
    )
`,
    count,
  );

  type LocationSummary = {
    zip?: string;
    zcta?: string;
    zip_zcta_equivalent: boolean;
    equivalent: boolean;
    geo?: CitySummary;
    places?: CitySummary[];
    countysubs?: CitySummary[];
    uniques?: CitySummary[];
    uniques_length?: number;
  };
  const locations: LocationSummary[] = [];

  const promises: Promise<IncomeInfo | null>[] = [];
  zips.forEach(async zip => {
    const promise = fetchAMIsForZip(db, zip.zip as string);
    promises.push(promise);
    const incomeInfo = await promise;
    if (incomeInfo !== undefined) {
      let places = incomeInfo?.places?.map(summarize);
      let countySubs = incomeInfo?.countysubs?.map(summarize);
      const uniques: CitySummary[] = [];
      if (!places) places = [];
      if (!countySubs) countySubs = [];

      [...places, ...countySubs].forEach(entity => {
        let found = false;
        for (const uniq of uniques) {
          if (_.isEqual(getComp(entity), uniq)) {
            found = true;
            break;
          }
        }
        if (!found) uniques.push(getComp(entity));
      });

      const geo = {
        state_id: incomeInfo?.location?.state_id,
        city: incomeInfo?.location?.city,
      };

      let equivalent = false;
      if (
        geo &&
        uniques &&
        uniques.length === 1 &&
        _.isEqual(geo, getComp(uniques.at(0)!))
      ) {
        equivalent = true;
      }
      const summary: LocationSummary = {
        zip: zip.zip,
        zcta: incomeInfo?.location.zip,
        zip_zcta_equivalent: zip.zip === incomeInfo?.location.zip,
        equivalent: equivalent,
        uniques: uniques,
        uniques_length: uniques.length,
        geo: geo,
        places: places,
        countysubs: countySubs,
      };
      locations.push(summary);
    }
  });
  await Promise.allSettled(promises).then(() => {
    fs.writeFileSync(
      'scripts/location-comparison.json',
      JSON.stringify(locations, null, 2) + '\n', // include newline to satisfy prettier
      'utf-8',
    );
  });
}

(async function () {
  const db = await open({
    filename: './incentives-api.db',
    driver: sqlite3.Database,
  });
  main(db, 1000);
})();
