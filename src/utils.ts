import fs from 'fs'
import path from 'path'
import { ESLint } from 'eslint'
import { lookItUpSync } from 'look-it-up'
import { ESLintOptions, LinterOptions, ProvidedOptions } from './options'
import {
  MAJORVERSION_REGEX,
  CACHE_HOME,
  DEFAULT_IGNORE,
  DEFAULT_GITIGNORE
} from './constants'

export const dirHasFile = (dir: string, file: string): boolean =>
  fs.existsSync(path.join(dir, file))

export const isRoot = (dir: string): string | undefined => {
  const hasPkgJson = dirHasFile(dir, 'package.json')
  const isSubModule = dirHasFile(path.join(dir, '../..'), 'node_modules')
  return (hasPkgJson && !isSubModule && dir) || undefined
}

export const getRootPath = (): string => {
  const cwd = process.cwd()
  if (isRoot(cwd) === cwd) {
    return cwd
  }
  return lookItUpSync(isRoot, path.dirname(cwd)) as string
}

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

const excludeUndefined = <T>(item: T | undefined): item is T => Boolean(item)

export const getIgnore = ({
  ignore,
  useGitIgnore,
  gitIgnoreFiles
}: Required<
  Pick<ProvidedOptions, 'ignore' | 'useGitIgnore' | 'gitIgnoreFiles'>
>): string[] => {
  const readFile = getReadFileFromRootFn()

  const ignoreFromFiles = [
    '.eslintignore',
    ...(useGitIgnore ? [...DEFAULT_GITIGNORE, ...gitIgnoreFiles] : [])
  ]
    .map(file => readFile(file))
    .filter(excludeUndefined)
    .map(text => text.split(/\r?\n/))
    .flat()
    .filter(filePath => !filePath.startsWith('#') && filePath !== '')

  return [...ignore, ...ignoreFromFiles]
}

type O = Record<string, unknown>

const isArray = (val: unknown): val is unknown[] => Array.isArray(val)
const isObject = (val: unknown): val is O =>
  Object.prototype.toString.call(val) === '[object Object]'

export const compare = (obj: unknown, src: unknown): boolean => {
  if (isArray(obj) && isArray(src)) {
    return src.every(srcItem => obj.some(objItem => compare(objItem, srcItem)))
  }
  if (isObject(obj) && isObject(src)) {
    return Object.entries(src).every(([srcKey, srcVal]) =>
      Object.entries(obj).some(
        ([objKey, objVal]) => objKey === srcKey && compare(objVal, srcVal)
      )
    )
  }
  return obj === src
}

export const mergeObj = <T>(obj: O, ...args: Array<O | undefined>): T => {
  const objCopy = Object.assign({}, obj)
  args.forEach(
    src =>
      src !== undefined &&
      Object.entries(src).forEach(([srcKey, srcVal]) => {
        if (srcVal === undefined) {
          return
        }
        const objVal = objCopy[srcKey]
        if (isArray(objVal) && isArray(srcVal)) {
          const filteredArr = srcVal.filter(
            val => !objVal.some(item => compare(item, val))
          )
          objCopy[srcKey] = objVal.concat(filteredArr)
          return
        }
        if (isObject(objVal) && isObject(srcVal)) {
          objCopy[srcKey] = mergeObj(objVal, srcVal)
          return
        }
        objCopy[srcKey] = srcVal
      })
  )
  return objCopy as T
}

type BooleanArgs = {
  [b in 'fix' | 'verbose' | 'version' | 'help' | 'stdin']?: boolean
}

type StringArgs = {
  [s in 'ext' | 'env' | 'globals' | 'parser' | 'plugins']?: string
}

interface DefaultArgs {
  '--'?: string[]
  _: string[]
}

export interface ParsedArgs extends BooleanArgs, StringArgs, DefaultArgs {}

export const mergeESLintOpsFromArgv = (
  { eslintOptions }: LinterOptions,
  { ext, env, globals, parser, plugins, fix }: ParsedArgs
): ESLintOptions => {
  const optionsFromArgs: Partial<ESLint.Options> = {
    extensions: (ext !== undefined && [ext]) || [],
    baseConfig: {
      env: (env !== undefined && { [env]: true }) || undefined,
      globals: (globals !== undefined && { [globals]: true }) || undefined,
      parser,
      plugins: (plugins !== undefined && [plugins]) || undefined
    },
    fix
  }
  return mergeObj(eslintOptions, optionsFromArgs)
}

export const getCacheLocation = (version: string, cmd: string): string => {
  const versionMatch = version.match(MAJORVERSION_REGEX)
  const majorVersion =
    (versionMatch !== null && `${versionMatch[1]}`) || undefined

  const cacheLocation = path.join(
    CACHE_HOME,
    cmd,
    majorVersion !== undefined ? `v${majorVersion}/` : ''
  )
  return cacheLocation
}

export const getHeadline = (
  cmd: string,
  tagline: string,
  homepage: string
): string => `\n${cmd}: ${tagline} (${homepage})`

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
