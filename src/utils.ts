import fs from 'fs'
import os from 'os'
import path from 'path'
import { lookItUpSync } from 'look-it-up'

export const isFileInDir = (file: string, dir: string): boolean =>
  fs.existsSync(path.join(dir, file))

export const findPkgJson = (dir: string): string | null =>
  isFileInDir('package.json', dir) ? dir : null

export const getRootPath = (): string | null => {
  const cwd = process.cwd()
  if (findPkgJson(cwd) === cwd) {
    return cwd
  }
  return lookItUpSync(findPkgJson, path.dirname(cwd))
}

export const readFileFromRoot = (file: string): string | null => {
  const rootPath = getRootPath()
  if (rootPath === null) {
    return null
  }
  const filePath = path.isAbsolute(file) ? file : path.join(rootPath, file)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null
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

export const compare = (target: unknown, src: unknown): boolean => {
  if (Object.is(target, src)) {
    return true
  }
  if (isArr(target) && isArr(src)) {
    if (target.length !== src.length) {
      return false
    }
    return src.every(srcItem =>
      target.some(targetItem => compare(targetItem, srcItem))
    )
  }
  if (isObj(target) && isObj(src)) {
    if (Object.keys(target).length !== Object.keys(src).length) {
      return false
    }
    return Object.entries(src).every(([srcKey, srcVal]) =>
      Object.entries(target).some(
        ([targetKey, targetVal]) =>
          targetKey === srcKey && compare(targetVal, srcVal)
      )
    )
  }
  return false
}

export const mergeConfig = (target: O, ...args: Array<O | undefined>): any => {
  args.forEach(src => {
    if (src !== undefined) {
      Object.entries(src).forEach(([srcKey, srcVal]) => {
        if (srcVal === undefined) {
          return
        }
        const targetVal = target[srcKey]
        if (compare(targetVal, srcVal)) {
          return
        }
        if (isArr(targetVal) && !isRule(targetVal) && isArr(srcVal)) {
          const filteredArr = srcVal.filter(
            srcItem =>
              !targetVal.some(targetItem => compare(targetItem, srcItem))
          )
          target[srcKey] = targetVal.concat(filteredArr)
          return
        }
        if (isObj(targetVal) && isObj(srcVal)) {
          target[srcKey] = mergeConfig(targetVal, srcVal)
          return
        }
        target[srcKey] = srcVal
      })
    }
  })
  return target
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
