import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import * as prettier from 'prettier';
import { GeoGroup } from '../../src/data/geo_groups';

const PROGRAMS_DIR = 'data/';
const GEOGROUPS_JSON_FILE = 'data/geo_groups.json';

const wordSeparators =
  /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]+/g;
const capital_plus_lower = /[A-ZÀ-Ý\u00C0-\u00D6\u00D9-\u00DD][a-zà-ÿ]/g;
const capitals = /[A-ZÀ-Ý\u00C0-\u00D6\u00D9-\u00DD]+/g;

function kebabCase(str: string) {
  // replace word starts with space + lower case equivalent for later parsing
  // 1) treat cap + lower as start of new word
  str = str.replace(capital_plus_lower, function (match) {
    // match is one caps followed by one non-cap
    return ' ' + (match[0].toLowerCase() || match[0]) + match[1];
  });
  // 2) treat all remaining capitals as words
  str = str.replace(capitals, function (match) {
    // match is a series of caps
    return ' ' + match.toLowerCase();
  });
  // 3) replace & with the word "and"
  str = str.replace('&', ' and ');

  return str
    .trim()
    .split(wordSeparators)
    .join('-')
    .replace(/^-/, '')
    .replace(/-\s*$/, '');
}

function lowerCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function createAuthorityName(
  state: string,
  authorityName: string,
): string {
  if (authorityName === undefined) {
    throw new Error('Undefined authority: check input file');
  }
  return (
    state.toLowerCase() + '-' + kebabCase(authorityName.replaceAll('.', ''))
  );
}

export function createProgramName(
  state: string,
  authorityName: string,
  programName: string,
): string {
  if (authorityName === undefined) {
    throw new Error('Undefined authority: check input file');
  }
  if (programName === undefined) {
    throw new Error('Undefined program title: check input file');
  }
  return (
    state.toLowerCase() +
    '_' +
    lowerCamelCase(authorityName.replaceAll('.', '')) +
    '_' +
    lowerCamelCase(programName.replaceAll('.', ''))
  );
}

/**
 * Splice in "group" between the state code and the rest, to emphasize that
 * the group ID need not be the same as the authority it's used with.
 */
export function authorityNameToGroupName(authorityName: string): string {
  return authorityName.substring(0, 3) + 'group-' + authorityName.substring(3);
}

export function sortMapByKey<T>(json: Record<string, T>): Record<string, T> {
  const ordered = Object.keys(json)
    .sort()
    .reduce(
      (obj, key) => {
        obj[key] = json[key];
        return obj;
      },
      {} as Record<string, T>,
    );
  return ordered;
}

export function updateAuthorities(
  existingJson: AuthorityTypeMap,
  authorityMap: AuthorityMap,
): AuthorityTypeMap {
  // Preserve existing utilities. Those are generated from an external dataset
  // by generate-utility-data.ts.
  const json: AuthorityTypeMap = { utility: existingJson.utility };

  const [utilities, nonUtilities] = _.partition(
    Object.entries(authorityMap),
    ([, auth]) => auth.authority_type === 'utility',
  );

  // Make sure all utilities already exist in JSON.
  for (const [utilityId] of utilities) {
    if (!(utilityId in json.utility)) {
      throw new Error(
        `Utility ${utilityId} is in spreadsheet but not in authorities.json. ` +
          'Run generate-utility-data.ts before this script (possibly after ' +
          "updating it to override the utility's name), or fix the " +
          'utility name in the spreadsheet.',
      );
    }
  }

  for (const [authorityShort, authority] of nonUtilities) {
    if (json[authority.authority_type.toLowerCase()] === undefined) {
      json[authority.authority_type.toLowerCase()] = {};
    }
    json[authority.authority_type.toLowerCase()][authorityShort] = {
      name: authority.name,
    };
  }

  return sortMapByKey(json);
}

export function updateGeoGroups(
  json: StateToGeoGroupMap,
  state: string,
  authorityMap: AuthorityMap,
): StateToGeoGroupMap {
  const otherAuthorities = Object.entries(authorityMap)
    .filter(([, auth]) => auth.authority_type === 'other')
    .map(([id]) => id)
    .sort();

  if (otherAuthorities.length === 0) {
    return json;
  }

  const stateGroups: { [id: string]: GeoGroup } = json[state] ?? {};
  for (const id of otherAuthorities) {
    const groupId = authorityNameToGroupName(id);
    if (!(groupId in stateGroups)) {
      stateGroups[groupId] = {
        utilities: [],
        cities: [],
        counties: [],
        incentives: [],
      };
    }
  }

  json[state] = sortMapByKey(stateGroups);
  return sortMapByKey(json);
}

type Program = {
  name: { en: string };
  url: { en: string };
  authority: string;
  authority_type: string;
};

export async function createProgramsContent(
  state: string,
  authorityMap: AuthorityMap,
  formatOptions: prettier.Options,
) {
  const programs: Record<string, Program> = {};

  for (const [authorityId, authority] of Object.entries(authorityMap)) {
    for (const [programShort, program] of Object.entries(authority.programs)) {
      programs[programShort] = {
        name: {
          en: program.name,
        },
        url: {
          en: program.url,
        },
        authority: authorityId,
        authority_type: authority.authority_type,
      };
    }
  }

  const output = JSON.stringify(programs, null, 2) + '\n';

  try {
    return await prettier.format(output, formatOptions);
  } catch (e) {
    console.error(
      `Error while trying to run prettier on programs.ts. Fix errors manually and reformat.`,
    );
    return output;
  }
}

type AuthorityKey = string;
type ProgramKey = string;
type StateKey = string;
type Authority = {
  name: string;
  authority_type: string;
  programs: ProgramMap;
};

type ProgramMap = {
  [index: ProgramKey]: { url: string; name: string };
};

export type AuthorityMap = {
  [index: AuthorityKey]: Authority;
};

// These types encapsulate how we parse and then re-write JSON to the data/authorities.json file.
type JsonAuthorities = {
  [index: AuthorityKey]: { name: string };
};
type AuthorityType = string;
export type AuthorityTypeMap = {
  [index: AuthorityType]: JsonAuthorities;
};
export type StateToAuthorityTypeMap = {
  [index: StateKey]: AuthorityTypeMap;
};
export type StateToGeoGroupMap = {
  [index: StateKey]: { [id: string]: GeoGroup };
};

export class AuthorityAndProgramUpdater {
  authorityMap: AuthorityMap = {};
  state: string;

  constructor(state: string) {
    this.state = state;
  }

  addRow(row: Record<string, string>) {
    if (row.authority_name === '' && row.program_title === '') {
      // Expected because we have some records at the end of the file that
      // are just IDs and should be ignored.
      return;
    }
    const program = row.program_title;
    const program_short = createProgramName(
      this.state,
      row.authority_name,
      row.program_title,
    );
    const authority = row.authority_name;
    const authority_short = createAuthorityName(this.state, authority);
    if (this.authorityMap[authority_short] === undefined) {
      this.authorityMap[authority_short] = {
        name: authority,
        authority_type: row.authority_type,
        programs: {},
      };
    }
    if (
      this.authorityMap[authority_short].programs[program_short] === undefined
    ) {
      this.authorityMap[authority_short].programs[program_short] = {
        name: program,
        url: row.program_url,
      };
    } else {
      if (
        this.authorityMap[authority_short].programs[program_short].name !==
          program ||
        this.authorityMap[authority_short].programs[program_short].url !==
          row.program_url
      ) {
        throw new Error(
          `Program name collision in row ${row.id}: ${program_short}. In ${authority}, ${program_short}: Existing: {name: ${this.authorityMap[authority_short].programs[program_short].name}, url: ${this.authorityMap[authority_short].programs[program_short].url}}; new: {name: ${program}, url: ${row.program_url}}`,
        );
      }
    }
  }

  updateAuthoritiesJson() {
    const filepath = path.join(
      __dirname,
      `../../data/${this.state}/authorities.json`,
    );
    if (!fs.existsSync(filepath)) {
      throw new Error(
        `No authorities.json file for ${this.state}. ` +
          `Make sure the directory data/${this.state} exists, then run ` +
          'generate-utility-data.ts, then run this script again.',
      );
    }
    const json: AuthorityTypeMap = JSON.parse(
      fs.readFileSync(filepath, 'utf-8'),
    );
    const updated = updateAuthorities(json, this.authorityMap);
    fs.writeFileSync(
      filepath,
      JSON.stringify(updated, null, 2) + '\n',
      'utf-8',
    );
  }

  async updatePrograms() {
    // Create program content and (over)write file.
    const filePath =
      PROGRAMS_DIR + '/' + this.state.toUpperCase() + '/programs.json';
    const formatOptions = await prettier.resolveConfig(filePath);
    if (!formatOptions) {
      throw new Error(`Could not retrieve Prettier config for ${filePath}`);
    }
    formatOptions.filepath = filePath;
    const jsonFileContent = await createProgramsContent(
      this.state,
      this.authorityMap,
      formatOptions,
    );
    fs.writeFileSync(filePath, jsonFileContent);
  }

  updateGeoGroupsJson() {
    const json: StateToGeoGroupMap = JSON.parse(
      fs.readFileSync(GEOGROUPS_JSON_FILE, 'utf-8'),
    );
    const updated = updateGeoGroups(json, this.state, this.authorityMap);
    fs.writeFileSync(
      GEOGROUPS_JSON_FILE,
      JSON.stringify(updated, null, 2) + '\n',
      'utf-8',
    );
  }
}
