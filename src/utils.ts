import fs from 'fs'
import path from 'path'
import findUp from 'find-up'
import { ParsedArgs } from 'minimist'
import mergeWith from 'lodash.mergewith'
import { ESLintOptions, LinterOptions, ProvidedOptions } from './options'
import { MAJORVERSION_REGEX, CACHE_HOME, DEFAULT_IGNORE } from './constants'

const isDirHas = (dir: string, name: string) =>
  fs.existsSync(path.join(dir, name))

const getRootPath = (): string =>
  findUp.sync(
    directory => {
      const hasPkgJson = isDirHas(directory, 'package.json')
      const isSubModule = isDirHas(
        path.join(directory, '../..'),
        'node_modules'
      )
      return (hasPkgJson && !isSubModule && directory) || undefined
    },
    { type: 'directory' }
  ) as string

const getReadFileFn = () => {
  const rootPath = getRootPath()

  return (file: string): string | null => {
    const filePath = path.isAbsolute(file) ? file : path.join(rootPath, file)
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  }
}

export const getIgnore = ({
  ignore,
  useGitIgnore,
  gitIgnoreFiles
}: Required<
  Pick<ProvidedOptions, 'ignore' | 'useGitIgnore' | 'gitIgnoreFiles'>
>): string[] => {
  const readFile = getReadFileFn()
  type ExcludesNull = <T>(s: T | null) => s is T

  const gitignore = useGitIgnore
    ? ['.gitignore', '.git/info/exclude', ...gitIgnoreFiles]
        .map(file => readFile(file))
        // eslint-disable-next-line
        .filter((Boolean as any) as ExcludesNull)
        .map(text => text.split(/\r?\n/))
        .flat()
        .filter(filePath => !filePath.startsWith('#'))
    : []

  return [...ignore, ...gitignore]
}

const customizeArrayMerge = (
  obj: unknown,
  src: unknown
): unknown[] | undefined => {
  if (Array.isArray(obj)) {
    return obj.concat(src)
  }
}

export const customizedMergeWith = <T, K = Partial<T>>(
  obj: K,
  ...otherArgs: Array<K | undefined>
): T => mergeWith(obj, ...otherArgs, customizeArrayMerge)

export const mergeESLintOpsFromArgv = (
  { eslintOptions }: LinterOptions,
  {
    ext = [],
    env = {},
    globals = {},
    parser = '',
    plugins = [],
    fix = false
  }: ParsedArgs
): ESLintOptions => {
  const optionsFromArgs: Partial<LinterOptions['eslintOptions']> = {
    extensions: ext,
    baseConfig: {
      env,
      globals,
      parser,
      plugins
    },
    fix
  }
  return mergeWith(eslintOptions, optionsFromArgs, customizeArrayMerge)
}

export const getCacheLocation = (version: string, cmd: string): string => {
  const versionMatch = version.match(MAJORVERSION_REGEX)
  const majorVersion = versionMatch && `${versionMatch[1]}`

  const cacheLocation = path.join(
    CACHE_HOME,
    cmd,
    majorVersion ? `v${majorVersion}/` : ''
  )
  return cacheLocation
}

export const getHeadline = (
  cmd: string,
  tagline: string,
  homepage: string
): string => `${cmd}: ${tagline} (${homepage})`

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
