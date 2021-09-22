import path from 'path'
import type { ESLint } from 'eslint'
import { mergeConfig, getCacheLocation } from './utils'
import {
  DEFAULT_CMD,
  DEFAULT_VERSION,
  DEFAULT_TAGLINE,
  DEFAULT_BUGS,
  DEFAULT_HOMEPAGE,
  DEFAULT_EXTENSIONS
} from './constants'

type CLIOptions = Partial<{
  [key in 'cmd' | 'version' | 'tagline' | 'bugs' | 'homepage']: string
}>

type ProvidedESLintOptions = Omit<ESLint.Options, 'cwd' | 'resolvePluginsRelativeTo'>

export interface ProvidedOptions extends CLIOptions {
  [key: string]: unknown

  ESLint: typeof ESLint
  eslintOptions?: Partial<ProvidedESLintOptions>

  cwd?: string
  extensions?: string[]
  ignore?: string[]

  configFile?: string

  fix?: boolean
}

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Pick<Required<T>, K>

export type ESLintOptions = PartiallyRequired<
  ProvidedESLintOptions,
  'extensions' | 'baseConfig' | 'useEslintrc' | 'fix' | 'cache' | 'cacheLocation'
>

export class Options {
  cmd: string
  version: string
  tagline: string
  bugs: string
  homepage: string

  ESLint: ProvidedOptions['ESLint']
  eslintOptions: ESLintOptions

  cwd: string

  constructor({
    cmd = DEFAULT_CMD,
    version = DEFAULT_VERSION,
    tagline = DEFAULT_TAGLINE,
    bugs = DEFAULT_BUGS,
    homepage = DEFAULT_HOMEPAGE,
    ESLint,
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

    this.ESLint = ESLint

    const configFileDirname = configFile === undefined ? undefined : path.dirname(configFile)

    this.eslintOptions = mergeConfig(
      {
        cwd: configFileDirname,
        extensions: extensions.concat(DEFAULT_EXTENSIONS),

        baseConfig: mergeConfig(configFile === undefined ? {} : require(configFile), {
          ignorePatterns: ignore
        }),
        resolvePluginsRelativeTo: configFileDirname,
        useEslintrc: true,

        fix,

        cache: true,
        cacheLocation: getCacheLocation(version, cmd)
      },
      eslintOptions
    )

    this.cwd = cwd
  }
}
