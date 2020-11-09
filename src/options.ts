import path from 'path'
import eslint, { ESLint } from 'eslint'
import { Assign } from 'utility-types'
import { getIgnore, mergeObj, getCacheLocation } from './utils'
import {
  DEFAULT_CMD,
  DEFAULT_VERSION,
  DEFAULT_TAGLINE,
  DEFAULT_HOMEPAGE,
  DEFAULT_BUGS,
  DEFAULT_EXTENSIONS,
  DEFAULT_IGNORE
} from './constants'

type NonNullableESLintOptions = Required<
  Pick<
    ESLint.Options,
    'extensions' | 'baseConfig' | 'useEslintrc' | 'cache' | 'cacheLocation'
  >
>

export type ESLintOptions = Assign<ESLint.Options, NonNullableESLintOptions>

interface SharedOptions {
  cmd: string
  version: string
  tagline: string
  homepage: string
  bugs: string
}

export interface LinterOptions extends SharedOptions {
  eslintOptions: ESLintOptions
}

export interface ProvidedOptions extends Partial<SharedOptions> {
  eslint: typeof eslint
  eslintOptions?: Partial<ESLint.Options>

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

  constructor({
    cmd = DEFAULT_CMD,
    version = DEFAULT_VERSION,
    tagline = DEFAULT_TAGLINE,
    homepage = DEFAULT_HOMEPAGE,
    bugs = DEFAULT_BUGS,
    cwd,
    extensions = [],
    eslintOptions,
    configFile,
    fix,
    ignore = DEFAULT_IGNORE,
    useGitIgnore = false,
    gitIgnoreFiles = []
  }: ProvidedOptions) {
    this.cmd = cmd
    this.version = version
    this.tagline = tagline
    this.homepage = homepage
    this.bugs = bugs

    this.eslintOptions = mergeObj(
      {
        cwd,
        extensions: DEFAULT_EXTENSIONS.concat(extensions),

        baseConfig: mergeObj(
          (configFile !== undefined && require(configFile)) || {},
          {
            ignorePatterns: getIgnore({ ignore, useGitIgnore, gitIgnoreFiles })
          }
        ),
        resolvePluginsRelativeTo: configFile && path.dirname(configFile),
        useEslintrc: Boolean(configFile),

        fix,

        cache: true,
        cacheLocation: getCacheLocation(version, cmd)
      },
      eslintOptions
    )
  }
}
