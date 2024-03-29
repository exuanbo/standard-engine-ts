import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  isFileInDir,
  findPkgJson,
  getRootPath,
  readFileFromRoot,
  getIgnoreFromFile,
  compare,
  mergeConfig,
  getCacheLocation
} from '../src/utils'
import { DEFAULT_CMD, DEFAULT_VERSION } from '../src/constants'

const cwd = process.cwd()

describe('isFileInDir', () => {
  it('should return true if dir has file', () => {
    expect(isFileInDir('package.json', '.')).toBe(true)
  })

  it('should return false if dir does not have file', () => {
    expect(isFileInDir('yarn.lock', '.')).toBe(false)
  })
})

describe('findPkgJson', () => {
  it('should return cwd as matcher result', () => {
    expect(findPkgJson(cwd)).toBe(cwd)
  })

  it('should return undefined as matcher result', () => {
    expect(findPkgJson(path.dirname(cwd))).toBe(null)
  })
})

describe('getRootPath', () => {
  it('should return the repository root path', () => {
    expect(getRootPath()).toBe(cwd)
  })
})

describe('readFileFromRoot', () => {
  it('should read files from the repository root path', () => {
    const res = readFileFromRoot('LICENSE')
    const expected = fs.readFileSync(path.join(cwd, 'LICENSE'), 'utf-8')
    expect(res).toBe(expected)
  })

  it('should return undefined if no such file exists', () => {
    const res = readFileFromRoot('foo_bar')
    expect(res).toBe(null)
  })
})

describe('getIgnoreFromFiles', () => {
  it('should get paths in files', () => {
    const res = getIgnoreFromFile('.gitignore')
    expect(res).toStrictEqual(['.cache', '*.tgz', 'coverage/', 'dist/'])
  })
})

describe('compare', () => {
  it('should compare deeply and return true', () => {
    const target = {
      0: [1, { a: [1, 2], b: [true, 2, 1], c: { d: [3, 4, { e: 5, f: [6, 7] }] } }],
      1: { g: [8, 9, { h: [false, 10] }] }
    }
    const src = {
      1: { g: [{ h: [10, false] }, 9, 8] },
      0: [{ c: { d: [{ f: [7, 6], e: 5 }, 4, 3] }, b: [1, 2, true], a: [2, 1] }, 1]
    }
    expect(compare(target, src)).toBe(true)
  })

  it('should compare deeply and return false', () => {
    const target = {
      0: [1, { a: [1, 2], b: [true, 2, 1], c: { d: [3, 4, { e: 5, f: [666, 7] }] } }],
      1: { g: [8, 9, { h: [false, 10] }] }
    }
    const src = {
      1: { g: [{ h: [10, false] }, 9, 8] },
      0: [{ c: { d: [{ f: [7, 6], e: 5 }, 4, 3] }, b: [1, 2, true], a: [2, 1] }, 1]
    }
    expect(compare(target, src)).toBe(false)
  })
})

describe('mergeConfig', () => {
  it('should merge objects recursively', () => {
    const target = {
      cwd: '.',
      extensions: ['.js'],
      baseConfig: {
        ignorePatterns: [],
        env: { browser: true },
        noInlineConfig: false,
        rules: {
          'object-shorthand': ['error', 'always', { avoidQuotes: true }]
        },
        settings: {}
      }
    }
    const src = {
      cwd: '..',
      extensions: ['.ts'],
      baseConfig: {
        ignorePatterns: ['dist/'],
        env: { jest: true },
        noInlineConfig: undefined,
        rules: { 'object-shorthand': ['warn', 'always'] },
        settings: { react: { version: 'detect' } }
      },
      useEslintrc: true
    }
    mergeConfig(target, src)
    expect(target).toStrictEqual({
      cwd: '..',
      extensions: ['.js', '.ts'],
      baseConfig: {
        ignorePatterns: ['dist/'],
        env: { browser: true, jest: true },
        noInlineConfig: false,
        rules: { 'object-shorthand': ['warn', 'always'] },
        settings: { react: { version: 'detect' } }
      },
      useEslintrc: true
    })
  })

  it('should merge objects recursively with empty obj', () => {
    const target = {}
    const src = {
      cwd: '.',
      extensions: ['.ts', '.tsx'],
      baseConfig: {
        parser: 'esprima',
        noInlineConfig: true
      }
    }
    mergeConfig(target, src)
    expect(target).toStrictEqual(src)
  })
})

describe('getCacheLocation', () => {
  it('should return cache location string', () => {
    const cachePath = getCacheLocation(DEFAULT_VERSION, DEFAULT_CMD)
    expect(cachePath).toBe(`${os.homedir()}/.cache/${DEFAULT_CMD}/v${DEFAULT_VERSION[0]}/`)
  })
})
