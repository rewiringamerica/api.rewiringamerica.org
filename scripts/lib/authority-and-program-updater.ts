import fs from 'fs';
import { Project } from 'ts-morph';
import { Programs, STATE_PROGRAMS_JSON_FILE } from '../../src/data/programs';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const PROGRAMS_TS_FILE = 'src/data/programs.ts';
project.addSourceFileAtPath(PROGRAMS_TS_FILE);
const sourceFile = project.getSourceFileOrThrow(PROGRAMS_TS_FILE);

const AUTHORITIES_JSON_FILE = 'data/authorities.json';

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
  if (authorityName === undefined)
    throw new Error('Undefined authority: check input file');
  return (
    state.toLowerCase() + '-' + kebabCase(authorityName.replaceAll('.', ''))
  );
}

export function createProgramName(
  state: string,
  authorityName: string,
  programName: string,
): string {
  if (authorityName === undefined)
    throw new Error('Undefined authority: check input file');
  if (programName === undefined)
    throw new Error('Undefined program title: check input file');
  return (
    state.toLowerCase() +
    '_' +
    lowerCamelCase(authorityName.replaceAll('.', '')) +
    '_' +
    lowerCamelCase(programName.replaceAll('.', ''))
  );
}

export function sortJsonAlphabeticallyByTopLevelKey<
  T extends { [index: string]: object },
>(json: T): T {
  return Object.fromEntries(
    Object.keys(json)
      .sort()
      .map(key => [key, json[key]]),
  ) as T;
}

export function updateAuthorities(
  json: StateToAuthorityTypeMap,
  state: string,
  authorityMap: AuthorityMap,
): StateToAuthorityTypeMap {
  const stateUpper = state.toUpperCase();
  json[stateUpper] = {};
  for (const [authorityShort, authority] of Object.entries(authorityMap)) {
    if (
      json[stateUpper][authority.authority_type.toLowerCase()] === undefined
    ) {
      json[stateUpper][authority.authority_type.toLowerCase()] = {};
    }
    json[stateUpper][authority.authority_type.toLowerCase()][authorityShort] = {
      name: authority.name,
    };
  }

  return sortJsonAlphabeticallyByTopLevelKey(json);
}

export function updateProgramsImpl(
  programs: Programs,
  state: string,
  authorityMap: AuthorityMap,
) {
  // Clear existing entries for that state.
  for (const key in programs) {
    if (key.startsWith(`${state.toLocaleLowerCase()}_`)) {
      delete programs[key];
    }
  }
  for (const authority of Object.values(authorityMap)) {
    for (const [programShort, program] of Object.entries(authority.programs)) {
      programs[programShort] = {
        name: {
          en: program.name,
        },
        url: {
          en: program.url,
        },
      };
    }
  }
  return sortJsonAlphabeticallyByTopLevelKey(programs);
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
type AuthorityTypeMap = {
  [index: AuthorityType]: JsonAuthorities;
};
export type StateToAuthorityTypeMap = {
  [index: StateKey]: AuthorityTypeMap;
};

export class AuthorityAndProgramUpdater {
  authorityMap: AuthorityMap = {};
  state: string;

  constructor(state: string) {
    this.state = state;
  }

  addRow(row: Record<string, string>) {
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
    const json: StateToAuthorityTypeMap = JSON.parse(
      fs.readFileSync(AUTHORITIES_JSON_FILE, 'utf-8'),
    );
    const updated = updateAuthorities(json, this.state, this.authorityMap);
    fs.writeFileSync(
      AUTHORITIES_JSON_FILE,
      JSON.stringify(updated, null, 2),
      'utf-8',
    );
  }

  updateProgramsTs() {
    const varStatement = sourceFile.getVariableStatement('ALL_PROGRAMS');
    if (varStatement !== undefined) {
      const initializer = varStatement
        .getDeclarations()[0]
        .getInitializerOrThrow();
      const text = initializer.getText();
      const split = text.lastIndexOf('\n]');
      let newText = `\n\n  // ${this.state}`;
      for (const authority of Object.values(this.authorityMap)) {
        newText += `\n  // ${authority.name}`;
        for (const program of Object.keys(authority.programs)) {
          newText += `\n  '${program}',`;
        }
      }
      initializer.replaceWithText(
        text.substring(0, split) + newText + text.substring(split),
      );
    }
    sourceFile.save();
  }

  updateProgramJson() {
    const json = JSON.parse(fs.readFileSync(STATE_PROGRAMS_JSON_FILE, 'utf-8'));

    const updated = updateProgramsImpl(json, this.state, this.authorityMap);

    fs.writeFileSync(
      STATE_PROGRAMS_JSON_FILE,
      JSON.stringify(updated, null, 2),
      'utf-8',
    );
  }
}
