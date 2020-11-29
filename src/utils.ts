import fs from 'fs'
import path from 'path'
import { lookItUpSync } from 'look-it-up'
import { ProvidedOptions } from './options'
import { MAJORVERSION_REGEX, CACHE_HOME } from './constants'

export const isDirHasFile = (dir: string, file: string): boolean =>
  fs.existsSync(path.join(dir, file))

export const isRoot = (dir: string): string | undefined => {
  const hasPkgJson = isDirHasFile(dir, 'package.json')
  const isSubModule = isDirHasFile(path.join(dir, '../..'), 'node_modules')
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

export const getIgnoreFromFile = (file: string): string[] => {
  const readFile = getReadFileFromRootFn()
  return (
    readFile(file)
      ?.split('\n')
      .filter(filePath => !filePath.startsWith('#') && filePath !== '') ?? []
  )
}

export const getIgnore = (
  ignore: NonNullable<ProvidedOptions['ignore']>
): string[] => [...ignore, ...getIgnoreFromFile('.eslintignore')]

type O = Record<string, unknown>

const getType = (val: unknown): string =>
  Object.prototype.toString.call(val).slice(8, -1)

const isArr = (val: unknown): val is unknown[] => getType(val) === 'Array'
const isObj = (val: unknown): val is O => getType(val) === 'Object'

export const compare = (obj: unknown, src: unknown): boolean => {
  if (isArr(obj) && isArr(src)) {
    return src.every(srcItem => obj.some(objItem => compare(objItem, srcItem)))
  }
  if (isObj(obj) && isObj(src)) {
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
        if (isArr(objVal) && isArr(srcVal)) {
          const filteredArr = srcVal.filter(
            val => !objVal.some(item => compare(item, val))
          )
          objCopy[srcKey] = objVal.concat(filteredArr)
          return
        }
        if (isObj(objVal) && isObj(srcVal)) {
          objCopy[srcKey] = mergeObj(objVal, srcVal)
          return
        }
        objCopy[srcKey] = srcVal
      })
  )
  return objCopy as T
}

export const getCacheLocation = (version: string, cmd: string): string => {
  const versionMatch = MAJORVERSION_REGEX.exec(version)
  const majorVersion =
    (versionMatch !== null && `${versionMatch[1]}`) || undefined

  const cacheLocation = path.join(
    CACHE_HOME,
    cmd,
    majorVersion !== undefined ? `v${majorVersion}/` : ''
  )
  return cacheLocation
}
