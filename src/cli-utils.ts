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
    extensions: ext !== undefined ? [ext] : [],
    baseConfig: {
      env: env !== undefined ? { [env]: true } : undefined,
      ignorePatterns:
        disableGitignore === true ? [] : getIgnoreFromFile('.gitignore'),
      globals: globals !== undefined ? { [globals]: true } : undefined,
      parser,
      plugins: plugins !== undefined ? [plugins] : undefined
    },
    fix
  }
  return mergeConfig(eslintOptions, optionsFromArgs)
}

/**
 * @link https://github.com/eslint/eslint/blob/master/bin/eslint.js#L45
 */
export const readStdin = async (): Promise<string> =>
  await new Promise((resolve, reject) => {
    let content = ''
    let chunk: string

    process.stdin
      .setEncoding('utf8')
      .on('readable', () => {
        while ((chunk = process.stdin.read()) !== null) {
          content += chunk
        }
      })
      .on('end', () => resolve(content))
      .on('error', reject)
  })
