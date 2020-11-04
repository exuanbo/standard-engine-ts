import path from 'path'
import eslint, { ESLint } from 'eslint'
import { Assign } from 'utility-types'
import { getIgnore, customizedMergeWith, getCacheLocation } from './utils'
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
    | 'baseConfig'
    | 'useEslintrc'
    | 'fix'
    | 'cache'
    | 'cacheLocation'
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
  eslint: typeof eslint

  cwd?: string
  extensions?: string[]
  ignore?: string[]
  useGitIgnore?: boolean
  gitIgnoreFiles?: string[]

  configFile?: string

  fix?: boolean
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
    const { eslintOptions, configFile } = opts

    this.eslintOptions = customizedMergeWith<ESLintOptions>(
      {
        cwd,
        extensions: DEFAULT_EXTENSIONS.concat(opts.extensions || []),

        baseConfig: customizedMergeWith<ESLint.Options['baseConfig']>(
          (configFile && require(configFile)) || {},
          eslintOptions?.baseConfig || {},
          {
            ignorePatterns: getIgnore(opts)
          }
        ),
        resolvePluginsRelativeTo: configFile && path.dirname(configFile),
        useEslintrc: Boolean(configFile),

        fix: opts.fix || false,

        cache: true,
        cacheLocation: getCacheLocation(this.version, this.cmd)
      },
      eslintOptions
    )
  }
}
