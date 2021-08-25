import type { ESLint } from 'eslint'
import type { Options } from './options'
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
  boolean: arrayWithTypes(['fix', 'disable-gitignore', 'help', 'version', 'stdin']),
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
  { eslintOptions }: Options,
  { fix, 'disable-gitignore': disableGitignore, env, ext, globals, parser, plugins }: ParsedArgs
): void => {
  const optionsFromArgs: Partial<ESLint.Options> = {
    extensions: ext !== undefined ? [ext] : undefined,
    baseConfig: {
      env: env !== undefined ? { [env]: true } : undefined,
      ignorePatterns: disableGitignore === true ? undefined : getIgnoreFromFile('.gitignore'),
      globals: globals !== undefined ? { [globals]: true } : undefined,
      parser,
      plugins: plugins !== undefined ? [plugins] : undefined
    },
    fix
  }
  mergeConfig(eslintOptions, optionsFromArgs)
}

/**
 * {@link https://github.com/eslint/eslint/blob/master/bin/eslint.js#L45}
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

export const enum TerminalStyle {
  Underline = '\u001b[4m',
  Red = '\u001b[31m',
  Yellow = '\u001b[33m',
  BrightBlack = '\u001b[30;1m',
  Reset = '\u001b[0m'
}
