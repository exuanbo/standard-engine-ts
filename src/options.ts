import path from 'path'
import eslint, { ESLint, Linter as ESLinter } from 'eslint'
import { Assign } from 'utility-types'
import { getIgnore, getCacheLocation } from './utils'
import {
  DEFAULT_CMD,
  DEFAULT_VERSION,
  DEFAULT_TAGLINE,
  DEFAULT_HOMEPAGE,
  DEFAULT_BUGS,
  DEFAULT_EXTENSIONS
} from './constants'

type NonNullableESLintOptions = Required<
  Pick<
    ESLint.Options,
    | 'cwd'
    | 'extensions'
    | 'resolvePluginsRelativeTo'
    | 'useEslintrc'
    | 'fix'
    | 'cache'
    | 'cacheLocation'
    | 'baseConfig'
  >
>

export type ESLintOptions = Assign<ESLint.Options, NonNullableESLintOptions>

export interface LinterOptions {
  cmd: string
  version: string
  tagline: string
  homepage: string
  bugs: string
  eslintOptions: ESLintOptions
}

export interface ProvidedOptions extends Partial<LinterOptions> {
  eslint?: typeof eslint

  cwd?: string
  extensions?: string[]

  configFile?: string

  fix?: boolean

  parserOpts?: ESLinter.Config['parserOptions']

  ignore?: string[]
  useGitIgnore?: boolean
  gitIgnoreFiles?: string[]
}

export class Options implements LinterOptions {
  cmd: string
  version: string
  tagline: string
  homepage: string
  bugs: string

  eslintOptions: ESLintOptions

  constructor(opts: ProvidedOptions) {
    this.cmd = opts.cmd || DEFAULT_CMD
    this.version = opts.version || DEFAULT_VERSION
    this.tagline = opts.tagline || DEFAULT_TAGLINE
    this.homepage = opts.homepage || DEFAULT_HOMEPAGE
    this.bugs = opts.bugs || DEFAULT_BUGS

    const cwd = opts.cwd || process.cwd()

    this.eslintOptions = {
      cwd,
      extensions: DEFAULT_EXTENSIONS.concat(opts.extensions || []),

      resolvePluginsRelativeTo:
        (opts.configFile && path.dirname(path.resolve(opts.configFile))) || cwd,
      useEslintrc: Boolean(opts.configFile),

      fix: opts.fix || false,

      cache: true,
      cacheLocation: getCacheLocation(this.version, this.cmd),

      ...(opts.eslintOptions || {}),

      baseConfig: {
        parserOptions: opts.parserOpts,
        ignorePatterns: getIgnore(opts),
        ...(opts.eslintOptions?.baseConfig || {})
      }
    }
  }
}
