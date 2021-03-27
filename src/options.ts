import path from 'path'
import eslint, { ESLint } from 'eslint'
import { mergeConfig, getCacheLocation } from './utils'
import {
  DEFAULT_CMD,
  DEFAULT_VERSION,
  DEFAULT_TAGLINE,
  DEFAULT_BUGS,
  DEFAULT_HOMEPAGE,
  DEFAULT_EXTENSIONS
} from './constants'

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Pick<Required<T>, K>

export type ESLintOptions = PartiallyRequired<
  ESLint.Options,
  | 'cwd'
  | 'extensions'
  | 'baseConfig'
  | 'resolvePluginsRelativeTo'
  | 'useEslintrc'
  | 'fix'
  | 'cache'
  | 'cacheLocation'
>

type SharedOptions = {
  [key in 'cmd' | 'version' | 'tagline' | 'bugs' | 'homepage']: string
}

export interface LinterOptions extends SharedOptions {
  eslintOptions: ESLintOptions
}

export interface ProvidedOptions extends Partial<SharedOptions> {
  [key: string]: unknown

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
  bugs: string
  homepage: string

  eslintOptions: ESLintOptions

  constructor({
    cmd = DEFAULT_CMD,
    version = DEFAULT_VERSION,
    tagline = DEFAULT_TAGLINE,
    bugs = DEFAULT_BUGS,
    homepage = DEFAULT_HOMEPAGE,
    eslintOptions,
    cwd = process.cwd(),
    extensions = [],
    ignore = [],
    configFile,
    fix = false
  }: ProvidedOptions) {
    this.cmd = cmd
    this.version = version
    this.tagline = tagline
    this.bugs = bugs
    this.homepage = homepage

    this.eslintOptions = mergeConfig(
      {
        cwd,
        extensions: extensions.concat(DEFAULT_EXTENSIONS),

        baseConfig: mergeConfig(
          configFile !== undefined ? require(configFile) : {},
          {
            ignorePatterns: ignore
          }
        ),
        resolvePluginsRelativeTo:
          configFile !== undefined ? path.dirname(configFile) : cwd,
        useEslintrc: true,

        fix,

        cache: true,
        cacheLocation: getCacheLocation(version, cmd)
      },
      eslintOptions
    )
  }
}
