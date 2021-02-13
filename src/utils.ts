import fs from 'fs'
import os from 'os'
import path from 'path'
import { lookItUpSync } from 'look-it-up'

export const isDirHasFile = (dir: string, file: string): boolean =>
  fs.existsSync(path.join(dir, file))

export const isRoot = (dir: string): string | undefined => {
  const hasPkgJson = isDirHasFile(dir, 'package.json')
  const hasNodeModules = isDirHasFile(dir, 'node_modules')
  return hasPkgJson && hasNodeModules ? dir : undefined
}

export const getRootPath = (): string | undefined => {
  const cwd = process.cwd()
  if (isRoot(cwd) === cwd) {
    return cwd
  }
  return lookItUpSync(isRoot, path.dirname(cwd))
}

export const readFileFromRoot = (file: string): string | undefined => {
  const rootPath = getRootPath()
  if (rootPath === undefined) {
    return undefined
  }
  const filePath = path.isAbsolute(file) ? file : path.join(rootPath, file)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return undefined
  }
}

export const getIgnoreFromFile = (file: string): string[] =>
  readFileFromRoot(file)
    ?.split('\n')
    .filter(filePath => !filePath.startsWith('#') && filePath !== '') ?? []

type O = Record<string, unknown>

const getType = (val: unknown): string =>
  Object.prototype.toString.call(val).slice(8, -1)

const isArr = (val: unknown): val is unknown[] => getType(val) === 'Array'
const isObj = (val: unknown): val is O => getType(val) === 'Object'

const isRule = (arr: unknown[]): boolean =>
  /^(?:off|warn|error|0|1|2)$/.test(String(arr[0]))

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

export const mergeConfig = (obj: O, ...args: Array<O | undefined>): any => {
  args.forEach(
    src =>
      src !== undefined &&
      Object.entries(src).forEach(([srcKey, srcVal]) => {
        if (srcVal === undefined) {
          return
        }
        const objVal = obj[srcKey]
        if (isArr(objVal) && !isRule(objVal) && isArr(srcVal)) {
          const filteredArr = srcVal.filter(
            val => !objVal.some(item => compare(item, val))
          )
          obj[srcKey] = objVal.concat(filteredArr)
          return
        }
        if (isObj(objVal) && isObj(srcVal)) {
          obj[srcKey] = mergeConfig(objVal, srcVal)
          return
        }
        obj[srcKey] = srcVal
      })
  )
  return obj
}

export const getCacheLocation = (version: string, cmd: string): string => {
  const cacheDirectory =
    process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache')

  const versionMatch = /^(\d+)\./.exec(version)
  const majorVersion = versionMatch !== null ? `${versionMatch[1]}` : undefined

  return path.join(
    cacheDirectory,
    cmd,
    majorVersion !== undefined ? `v${majorVersion}/` : ''
  )
}
