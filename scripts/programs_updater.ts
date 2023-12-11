import fs from 'fs';
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const PROGRAMS_TS_FILE = 'src/data/programs.ts';
project.addSourceFileAtPath(PROGRAMS_TS_FILE);
const sourceFile = project.getSourceFileOrThrow(PROGRAMS_TS_FILE);

const PROGRAMS_JSON_FILE = 'data/programs.json';
const AUTHORITIES_JSON_FILE = 'data/authorities.json';

const wordSeparators =
  /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]+/;
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
  if (authorityName === undefined) throw new Error("Undefined authority: check input file")
  return (
    state.toLowerCase() + '-' + kebabCase(authorityName.replaceAll('.', ''))
  );
}

export function createProgramName(
  state: string,
  authorityName: string,
  programName: string,
): string {
  if (authorityName === undefined) throw new Error("Undefined authority: check input file")
  if (programName === undefined) throw new Error("Undefined program title: check input file")
  return (
    state.toLowerCase() +
    '_' +
    lowerCamelCase(authorityName.replaceAll('.', '')) +
    lowerCamelCase(programName.replaceAll('.', ''))
  );
}

type AuthorityKey = string;
type ProgramKey = string;
type Authority = {
  name: string;
  authority_type: string;
  programs: ProgramMap;
};

type ProgramMap = {
  [index: ProgramKey]: { url: string; name: string };
};

type AuthorityMap = {
  [index: AuthorityKey]: Authority;
};

export class AuthorityAndProgramManager {
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
        authority_type: row.authority_level,
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
    const json = JSON.parse(fs.readFileSync(AUTHORITIES_JSON_FILE, 'utf-8'));
    const stateUpper = this.state.toUpperCase();
    if (stateUpper in json) {
      throw new Error(
        `State ${stateUpper} already exists in Authorities file: ${AUTHORITIES_JSON_FILE}`,
      );
    }
    json[stateUpper] = {};
    for (const [authorityShort, authority] of Object.entries(
      this.authorityMap,
    )) {
      if (json[stateUpper][authority.authority_type.toLowerCase()] === undefined) {
        json[stateUpper][authority.authority_type.toLowerCase()] = {};
      }
      json[stateUpper][authority.authority_type.toLowerCase()][authorityShort] = {
        name: authority.name,
      };
    }
    fs.writeFileSync(
      AUTHORITIES_JSON_FILE,
      JSON.stringify(json, null, 2),
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
    const json = JSON.parse(fs.readFileSync(PROGRAMS_JSON_FILE, 'utf-8'));
    for (const authority of Object.values(this.authorityMap)) {
      for (const [programShort, program] of Object.entries(
        authority.programs,
      )) {
        if (programShort in json) {
          throw new Error(
            `Program ${programShort} already exists in Programs file: ${PROGRAMS_JSON_FILE}`,
          );
        }
        json[programShort] = {
          name: {
            en: program.name,
          },
          url: {
            en: program.url,
          },
        };
      }
    }
    fs.writeFileSync(
      PROGRAMS_JSON_FILE,
      JSON.stringify(json, null, 2),
      'utf-8',
    );
  }
}
