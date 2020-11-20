import { ESLint } from 'eslint'
import { ESLintOptions, LinterOptions } from './options'
import { mergeObj } from './utils'
import { DEFAULT_IGNORE } from './constants'

const literalArray = <T extends string>(arr: T[]): T[] => arr

export const MINIMIST_OPTS = {
  alias: {
    env: 'envs',
    globals: 'global',
    plugins: 'plugin',
    help: 'h',
    version: 'v'
  },
  boolean: literalArray(['fix', 'verbose', 'version', 'help', 'stdin']),
  string: literalArray(['env', 'globals', 'plugins', 'parser', 'ext'])
}

type BooleanArgs = {
  [b in typeof MINIMIST_OPTS.boolean[number]]?: boolean
}

type StringArgs = {
  [s in typeof MINIMIST_OPTS.string[number]]?: string
}

interface DefaultArgs {
  '--'?: string[]
  _: string[]
}

export interface ParsedArgs extends BooleanArgs, StringArgs, DefaultArgs {}

export const mergeESLintOpsFromArgv = (
  { eslintOptions }: LinterOptions,
  { ext, env, globals, parser, plugins, fix }: ParsedArgs
): ESLintOptions => {
  const optionsFromArgs: Partial<ESLint.Options> = {
    extensions: (ext !== undefined && [ext]) || [],
    baseConfig: {
      env: (env !== undefined && { [env]: true }) || undefined,
      globals: (globals !== undefined && { [globals]: true }) || undefined,
      parser,
      plugins: (plugins !== undefined && [plugins]) || undefined
    },
    fix
  }
  return mergeObj(eslintOptions, optionsFromArgs)
}

export const getHeadline = (
  cmd: string,
  tagline: string,
  homepage: string
): string => `\n${cmd}: ${tagline} (${homepage})`

export const getHelp = (cmd: string, extensions: string[]): string => {
  const extPatterns = extensions.map(ext => `*${ext}`).join(', ')
  const pathPatterns = DEFAULT_IGNORE.join(', ')

  return `
usage: ${cmd} <flags> [FILES...]

  If FILES is omitted, all source files (${extPatterns})
  in the current working directory will be checked recursively.

  Certain paths ${pathPatterns}, files/folders that begin with '.'
  like .git/ and paths in the project's root .gitignore are ignored by default.

Basic:
  --fix          Automatically fix problems
  --verbose      Show rule names for errors (to ignore specific rules)
  -v, --version  Show current version
  -h, --help     Show usage information

Advanced:
  --stdin        Read file text from stdin
  --ext          Specify JavaScript file extensions
  --global       Declare global variable
  --plugin       Use custom eslint plugin
  --env          Use custom eslint environment
  --parser       Use custom js parser (e.g. babel-eslint)
`
}
