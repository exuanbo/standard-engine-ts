import fs from 'fs'
import path from 'path'
import { lookItUpSync } from 'look-it-up'
import { ParsedArgs } from 'minimist'
import { ESLintOptions, LinterOptions, ProvidedOptions } from './options'
import { MAJORVERSION_REGEX, CACHE_HOME, DEFAULT_IGNORE } from './constants'

export const dirHasFile = (dir: string, file: string): boolean =>
  fs.existsSync(path.join(dir, file))

export const getRootPath = (): string =>
  lookItUpSync(directory => {
    const hasPkgJson = dirHasFile(directory, 'package.json')
    const isSubModule = dirHasFile(
      path.join(directory, '../..'),
      'node_modules'
    )
    return (hasPkgJson && !isSubModule && directory) || undefined
  }) as string

export const getReadFileFromRootFn = (): ((
  file: string
) => string | undefined) => {
  const rootPath = getRootPath()

  return file => {
    const filePath = path.isAbsolute(file) ? file : path.join(rootPath, file)
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return undefined
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
  const readFile = getReadFileFromRootFn()
  type ExcludesUndefined = <T>(s: T | undefined) => s is T

  const gitignore = useGitIgnore
    ? ['.gitignore', '.git/info/exclude', ...gitIgnoreFiles]
        .map(file => readFile(file))
        .filter((Boolean as unknown) as ExcludesUndefined)
        .map(text => text.split(/\r?\n/))
        .flat()
        .filter(filePath => !filePath.startsWith('#') && filePath !== '')
    : []

  return [...ignore, ...gitignore]
}

type Obj = Record<string, unknown>

export const mergeObj = <T>(obj: Obj, ...args: Array<Obj | undefined>): T => {
  args.forEach(
    src =>
      src &&
      Object.entries(src).forEach(([srcKey, srcVal]) => {
        const objVal = obj[srcKey]
        if (Array.isArray(objVal) && Array.isArray(srcVal)) {
          const filteredArr = srcVal.filter(
            (val: unknown) => !objVal.some(item => item === val)
          )
          obj[srcKey] = objVal.concat(filteredArr)
          return
        }
        if (
          typeof objVal === 'object' &&
          typeof srcVal === 'object' &&
          objVal !== null
        ) {
          mergeObj(objVal as Obj, srcVal as Obj)
          return
        }
        obj[srcKey] = srcVal
      })
  )
  return obj as T
}

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
  const optionsFromArgs: Partial<ESLintOptions> = {
    extensions: ext,
    baseConfig: {
      env,
      globals,
      parser,
      plugins
    },
    fix
  }
  return mergeObj(eslintOptions, optionsFromArgs)
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
