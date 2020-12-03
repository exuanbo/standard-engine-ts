import { ESLint } from 'eslint'
import { ESLintOptions, LinterOptions } from './options'
import { getIgnoreFromFile, mergeConfig } from './utils'

const arrayWithTypes = <T extends string>(arr: T[]): T[] => arr

export const MINIMIST_OPTS = {
  alias: {
    env: 'envs',
    globals: 'global',
    help: 'h',
    plugins: 'plugin',
    version: 'v'
  },
  boolean: arrayWithTypes([
    'fix',
    'verbose',
    'disable-gitignore',
    'help',
    'version',
    'stdin'
  ]),
  string: arrayWithTypes(['env', 'ext', 'globals', 'parser', 'plugins'])
}

type BooleanArgs = {
  [b in typeof MINIMIST_OPTS.boolean[number]]?: boolean
}

type StringArgs = {
  [s in typeof MINIMIST_OPTS.string[number]]?: string
}

interface DefaultArgs {
  _: string[]
}

export interface ParsedArgs extends BooleanArgs, StringArgs, DefaultArgs {}

export const mergeOptionsFromArgv = (
  { eslintOptions }: LinterOptions,
  {
    fix,
    'disable-gitignore': disableGitignore,
    env,
    ext,
    globals,
    parser,
    plugins
  }: ParsedArgs
): ESLintOptions => {
  const optionsFromArgs: Partial<ESLint.Options> = {
    extensions: (ext !== undefined && [ext]) || [],
    baseConfig: {
      env: (env !== undefined && { [env]: true }) || undefined,
      ignorePatterns:
        disableGitignore === true ? [] : getIgnoreFromFile('.gitignore'),
      globals: (globals !== undefined && { [globals]: true }) || undefined,
      parser,
      plugins: (plugins !== undefined && [plugins]) || undefined
    },
    fix
  }
  return mergeConfig(eslintOptions, optionsFromArgs)
}

export const getHeadline = (
  cmd: string,
  tagline: string,
  homepage: string
): string => `${cmd}: ${tagline} (${homepage})`

export const getHelp = (cmd: string, extensions: string[]): string => {
  const extPatterns = extensions.map(ext => `*${ext}`).join(', ')

  return `
Usage: ${cmd} <flags> [FILES...]

  If FILES is omitted, all source files (${extPatterns})
  in the current working directory will be checked recursively.

  By default, files/folders that begin with '.' like .eslintrc .cache/
  and paths in the project's root .gitignore are automatically ignored.

Basic:
  --fix                Automatically fix problems
  --verbose            Show rule names for errors (to ignore specific rules)

Config:
  --env                Use custom eslint environment
  --ext                Specify file extensions
  --global             Declare global variable
  --parser             Use custom parser (e.g. babel-eslint)
  --plugin             Use custom eslint plugin

Input:
  --stdin              Read file text from stdin
  --disable-gitignore  Disable use of .gitignore by default

Misc:
  -h, --help           Show usage information
  -v, --version        Show current version
`
}
