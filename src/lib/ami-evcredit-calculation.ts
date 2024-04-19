import { Database } from 'sqlite';
import { ResolvedLocation } from './location';
import { roundFiftyDollars } from './rounding';

export type AMIAndEVCreditEligibility = {
  computedAMI80: number;
  computedAMI150: number;
  evCreditEligible: boolean;
};

/**
 * AMIs are given for households of 4 people. For smaller ones, subtract 10% for
 * each fewer person. For larger ones, add 8% per person.
 */
export function adjustAMI(baseAMI: number, householdSize: number): number {
  return roundFiftyDollars(
    householdSize < 4
      ? baseAMI * (1 - 0.1 * (4 - householdSize))
      : householdSize > 4
      ? baseAMI * (1 + 0.08 * (householdSize - 4))
      : baseAMI,
  );
}

/**
 * These territories need special handling as their data isn't included with the
 * rest of the states/territories.
 */
const EXCEPTION_TERRITORIES = new Set(['AS', 'GU', 'MP', 'VI']);

type AMIRow = {
  ami_80: number;
  ami_150: number;
};

export async function computeAMIAndEVCreditEligibility(
  db: Database,
  resolvedLocation: ResolvedLocation,
  householdSize: number,
): Promise<AMIAndEVCreditEligibility | null> {
  let ami: AMIRow | undefined;
  let evCreditEligible: boolean;
  if (EXCEPTION_TERRITORIES.has(resolvedLocation.state)) {
    // US Virgin Islands have several zips with different AMIs. American Samoa,
    // Guam, and the Northern Mariana Islands have a single AMI each.
    ami =
      resolvedLocation.state === 'VI'
        ? await db.get<AMIRow>(
            'SELECT * FROM ami_by_territory_zip WHERE zip = ?',
            resolvedLocation.zcta,
          )
        : await db.get<AMIRow>(
            'SELECT * FROM ami_by_territory_zip WHERE state = ?',
            resolvedLocation.state,
          );

    // The entirety of these territories is non-urban and thus 30C-eligible.
    evCreditEligible = true;
  } else {
    ami = resolvedLocation.tractGeoid
      ? await db.get<AMIRow>(
          'SELECT * FROM ami_by_tract WHERE tract_geoid = ?',
          resolvedLocation.tractGeoid,
        )
      : await db.get<AMIRow>(
          'SELECT * FROM ami_by_zcta WHERE zcta = ?',
          resolvedLocation.zcta,
        );
    const ev = resolvedLocation.tractGeoid
      ? await db.get<{ is_eligible: string }>(
          'SELECT is_eligible FROM "30c_eligibility_by_tract" WHERE tract_geoid = ?',
          resolvedLocation.tractGeoid,
        )
      : await db.get<{ is_eligible: string }>(
          'SELECT is_eligible FROM "30c_eligibility_by_zcta" WHERE zcta = ?',
          resolvedLocation.zcta,
        );
    if (!ev) {
      return null;
    }

    evCreditEligible = !!parseInt(ev.is_eligible);
  }

  if (!ami) {
    return null;
  }

  return {
    computedAMI80: adjustAMI(ami.ami_80, householdSize),
    computedAMI150: adjustAMI(ami.ami_150, householdSize),
    evCreditEligible,
  };
}
