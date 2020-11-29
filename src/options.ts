import path from 'path'
import eslint, { ESLint } from 'eslint'
import { Assign } from 'utility-types'
import { getIgnore, mergeConfig, getCacheLocation } from './utils'
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
    | 'extensions'
    | 'baseConfig'
    | 'resolvePluginsRelativeTo'
    | 'useEslintrc'
    | 'fix'
    | 'cache'
    | 'cacheLocation'
  >
>

export type ESLintOptions = Assign<ESLint.Options, NonNullableESLintOptions>

type SharedOptions = {
  [key in 'cmd' | 'version' | 'tagline' | 'homepage' | 'bugs']: string
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
    fix = false,
    ignore = []
  }: ProvidedOptions) {
    this.cmd = cmd
    this.version = version
    this.tagline = tagline
    this.homepage = homepage
    this.bugs = bugs

    this.eslintOptions = mergeConfig(
      {
        cwd,
        extensions: extensions.concat(DEFAULT_EXTENSIONS),

        baseConfig: mergeConfig(
          (configFile !== undefined && require(configFile)) || {},
          {
            ignorePatterns: getIgnore(ignore)
          }
        ),
        resolvePluginsRelativeTo:
          (configFile !== undefined && path.dirname(configFile)) || cwd,
        useEslintrc: Boolean(configFile),

        fix,

        cache: true,
        cacheLocation: getCacheLocation(version, cmd)
      },
      eslintOptions
    )
  }
}
