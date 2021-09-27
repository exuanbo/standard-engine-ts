import type { ESLint } from 'eslint'
import type { Options } from './options'
import { getIgnoreFromFile, mergeConfig } from './utils'

const unionArray = <T extends string>(arr: T[]): T[] => arr

export const MINIMIST_OPTS = {
  string: unionArray(['env', 'ext', 'globals', 'parser', 'plugins']),
  boolean: unionArray(['fix', 'disable-gitignore', 'help', 'version', 'stdin']),
  alias: {
    env: 'envs',
    globals: 'global',
    help: 'h',
    plugins: 'plugin',
    version: 'v'
  }
}

type StringArgs = {
  [s in typeof MINIMIST_OPTS.string[number]]?: string | string[]
}

type BooleanArgs = {
  [b in typeof MINIMIST_OPTS.boolean[number]]?: boolean
}

interface DefaultArgs {
  _: string[]
}

export interface ParsedArgs extends BooleanArgs, StringArgs, DefaultArgs {}

const toArray = (val: string | string[]): string[] => (typeof val === 'string' ? [val] : val)
const toObj = (val: string | string[]): Record<string, true> =>
  Object.fromEntries(toArray(val).map(valName => [valName, true]))

export const mergeOptionsFromArgv = (
  { eslintOptions }: Options,
  { fix, 'disable-gitignore': disableGitignore, env, ext, globals, parser, plugins }: ParsedArgs
): void => {
  const optionsFromArgs: Partial<ESLint.Options> = {
    extensions: ext === undefined ? undefined : toArray(ext),
    baseConfig: {
      env: env === undefined ? undefined : toObj(env),
      ignorePatterns: disableGitignore === true ? undefined : getIgnoreFromFile('.gitignore'),
      globals: globals === undefined ? undefined : toObj(globals),
      parser: parser === undefined ? undefined : toArray(parser).slice(-1)[0],
      plugins: plugins === undefined ? undefined : toArray(plugins)
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
      .on('end', () => {
        resolve(content)
      })
      .on('error', reject)
  })

export enum TerminalStyle {
  Underline = '\u001b[4m',
  Red = '\u001b[31m',
  Yellow = '\u001b[33m',
  BrightBlack = '\u001b[30;1m',
  Reset = '\u001b[0m'
}
