import fs from 'fs';
import * as prettier from 'prettier';
import { Project, SourceFile } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const PROGRAMS_DIR = 'src/data/programs/';
const PROGRAMS_TS_FILE = 'src/data/programs.ts';
project.addSourceFileAtPath(PROGRAMS_TS_FILE);
const globalSourceFile = project.getSourceFileOrThrow(PROGRAMS_TS_FILE);

const AUTHORITIES_JSON_FILE = 'data/authorities.json';
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
    .reduce((obj, key) => {
      obj[key] = json[key];
      return obj;
    }, {} as Record<string, T>);
  return ordered;
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

  return sortMapByKey(json);
}

export async function createProgramsContent(
  state: string,
  authorityMap: AuthorityMap,
  formatOptions: prettier.Options,
) {
  // We don't need to worry too much about formatting because we
  // programmtically invoke prettier at the end.
  let output = `export const ${state.toUpperCase()}_PROGRAMS = {\n`;
  for (const authority of Object.values(authorityMap)) {
    for (const [programShort, program] of Object.entries(authority.programs)) {
      output += `'${programShort}': {\n`;
      output += 'name: {\n';
      output += `en: '${program.name}',\n`;
      output += '},\n';
      output += 'url: {\n';
      output += `en: '${program.url}',\n`;
      output += '},\n';
      output += '},\n';
    }
  }
  output += '} as const;';
  try {
    return await prettier.format(output, formatOptions);
  } catch (e) {
    console.error(
      `Error while trying to run prettier on programs.ts. Fix errors manually and reformat.`,
    );
    return output;
  }
}

export function maybeUpdateProgramsTsFile(
  state: string,
  sourceFile: SourceFile,
  save: boolean = true,
) {
  // If there is an existing import for this state in PROGRAMS_TS_FILE, it's
  // already configured and we don't need to do anything.
  const moduleSpecifier = `./programs/${state.toLowerCase()}_programs`;
  if (sourceFile.getImportDeclaration(moduleSpecifier)) {
    return;
  }

  // Otherwise
  // 1. Insert an import in between the right states alphabetically.
  const newDefaultImport = `${state.toUpperCase()}_PROGRAMS`;
  let inserted = false;
  let lastStateImport = 0;
  for (const [ind, importDec] of sourceFile.getImportDeclarations().entries()) {
    const defaultImport = importDec.getDefaultImport();
    if (!defaultImport) continue;
    // Skip non-state imports.
    if (!defaultImport!.getText().endsWith('_PROGRAMS')) continue;
    lastStateImport = ind;
    // If the current import is alphabetically greater than the new one,
    // insert a new import and exit the loop.
    if (defaultImport!.getText() > newDefaultImport) {
      sourceFile.insertImportDeclaration(ind, {
        defaultImport: newDefaultImport,
        moduleSpecifier: `${moduleSpecifier}`,
      });
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    sourceFile.insertImportDeclaration(lastStateImport + 1, {
      defaultImport: newDefaultImport,
      moduleSpecifier: `${moduleSpecifier}`,
    });
  }

  // 2. Find all_programs definition and insert programs similar to the above.
  const programsDef = sourceFile.getVariableStatement('all_programs');
  if (!programsDef) {
    throw new Error(
      `Could not find all_programs variable definition in ${PROGRAMS_TS_FILE}`,
    );
  }
  const varInitializer = programsDef
    .getDeclarations()[0]
    .getInitializerOrThrow();

  // See tests for how this string-hacking is supposed to work.
  const components = varInitializer.getText().split(',\n');
  for (const [ind, component] of components.entries()) {
    if (ind === 0) continue; // skip ira_incentives
    // This still works for the last component since it starts with }
    if (component > `  ...${newDefaultImport}`) {
      components.splice(ind, 0, `  ...${newDefaultImport}`);
      break;
    }
  }
  varInitializer.replaceWithText(components.join(',\n'));
  if (save) {
    sourceFile.save();
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

type GeoGroup = {
  utilities?: string[];
  cities?: string[];
  counties?: string[];
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

  async updatePrograms() {
    // Create program content and (over)write file.
    const filePath = PROGRAMS_DIR + `${this.state.toLowerCase()}_programs.ts`;
    const formatOptions = await prettier.resolveConfig(filePath);
    if (!formatOptions) {
      throw new Error(`Could not retrieve Prettier config for ${filePath}`);
    }
    formatOptions.filepath = filePath;
    const tsFileContent = await createProgramsContent(
      this.state,
      this.authorityMap,
      formatOptions,
    );
    fs.writeFileSync(filePath, tsFileContent);

    maybeUpdateProgramsTsFile(this.state, globalSourceFile);
  }

  updateGeoGroupsJson() {
    const otherAuthorities = Object.entries(this.authorityMap)
      .filter(([, auth]) => auth.authority_type === 'Other')
      .map(([id]) => id)
      .sort();

    if (otherAuthorities.length === 0) {
      return;
    }

    const json = JSON.parse(fs.readFileSync(GEOGROUPS_JSON_FILE, 'utf-8'));

    const stateGroups: { [id: string]: GeoGroup } = json[this.state] ?? {};
    for (const id of otherAuthorities) {
      const groupId = authorityNameToGroupName(id);
      if (!(groupId in stateGroups)) {
        stateGroups[groupId] = {
          utilities: [],
          cities: [],
          counties: [],
        };
      }
    }

    json[this.state] = sortMapByKey(stateGroups);

    fs.writeFileSync(
      GEOGROUPS_JSON_FILE,
      JSON.stringify(sortMapByKey(json), null, 2),
      'utf-8',
    );
  }
}
