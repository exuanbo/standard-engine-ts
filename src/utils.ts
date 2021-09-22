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

type Obj = Record<string, unknown>

const getType = (val: unknown): string => Object.prototype.toString.call(val).slice(8, -1)

const isArr = (val: unknown): val is unknown[] => getType(val) === 'Array'
const isObj = (val: unknown): val is Obj => getType(val) === 'Object'

const isRule = (arr: unknown[]): boolean => /^(?:off|warn|error|0|1|2)$/.test(String(arr[0]))

export const compare = (target: unknown, source: unknown): boolean => {
  if (target === source) {
    return true
  }
  if (isArr(target) && isArr(source)) {
    if (target.length !== source.length) {
      return false
    }
    return source.every(srcItem => target.some(targetItem => compare(targetItem, srcItem)))
  }
  if (isObj(target) && isObj(source)) {
    if (Object.keys(target).length !== Object.keys(source).length) {
      return false
    }
    const targetObjectEntries = Object.entries(target)
    return Object.entries(source).every(([srcKey, srcVal]) =>
      targetObjectEntries.some(
        ([targetKey, targetVal]) => targetKey === srcKey && compare(targetVal, srcVal)
      )
    )
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeConfig = (target: Obj, ...sources: Array<Obj | undefined>): any => {
  sources.forEach(source => {
    if (source === undefined) {
      return
    }
    Object.entries(source).forEach(([srcKey, srcVal]) => {
      if (srcVal === undefined) {
        return
      }
      const targetVal = target[srcKey]
      if (compare(targetVal, srcVal)) {
        return
      }
      if (isArr(targetVal) && !isRule(targetVal) && isArr(srcVal)) {
        const filteredArr = srcVal.filter(
          srcItem => !targetVal.some(targetItem => compare(targetItem, srcItem))
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
  })
  return target
}

const MAJOR_VERSION_REGEXP = /^(\d+)\./

export const getCacheLocation = (version: string, cmd: string): string => {
  const cacheDirectory = process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache')
  const majorVersion = MAJOR_VERSION_REGEXP.exec(version)?.[1]

  return path.join(cacheDirectory, cmd, majorVersion === undefined ? '' : `v${majorVersion}/`)
}
