import fs from 'fs'
import path from 'path'
import { lookItUpSync } from 'look-it-up'
import { ProvidedOptions } from './options'
import { MAJORVERSION_REGEX, CACHE_HOME, DEFAULT_GITIGNORE } from './constants'

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
