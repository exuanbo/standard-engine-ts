import fs from 'fs'
import path from 'path'
import eslint from 'eslint'
import { Options } from '../src/options'
import {
  dirHasFile,
  isRoot,
  getRootPath,
  getReadFileFromRootFn,
  getIgnore,
  mergeObj,
  mergeESLintOpsFromArgv,
  getCacheLocation,
  getHeadline,
  getHelp
} from '../src/utils'
import {
  DEFAULT_CMD,
  DEFAULT_VERSION,
  DEFAULT_TAGLINE,
  DEFAULT_HOMEPAGE,
  DEFAULT_EXTENSIONS,
  CACHE_HOME
} from '../src/constants'

const cwd = process.cwd()

describe('utils', () => {
  it('should return true if dir has file', () => {
    expect(dirHasFile('.', 'package.json')).toBe(true)
  })

  it('should return false if dir does not have file', () => {
    expect(dirHasFile('.', 'package-log.json')).toBe(false)
  })

  it('should return cwd as matcher result', () => {
    expect(isRoot(cwd)).toBe(cwd)
  })

  it('should return undefined as matcher result', () => {
    expect(isRoot(path.dirname(cwd))).toBe(undefined)
  })

  it('should return the repository root path', () => {
    expect(getRootPath()).toBe(cwd)
  })

  it('should read files from the repository root path', () => {
    const readFile = getReadFileFromRootFn()
    const licenseContents = fs.readFileSync(path.join(cwd, 'LICENSE'), 'utf-8')
    expect(readFile('LICENSE')).toBe(licenseContents)
  })

  it('should return undefined if no such file exists', () => {
    const readFile = getReadFileFromRootFn()
    expect(readFile('foo_bar')).toStrictEqual(undefined)
  })

  it('should return an array of ignored files if `useGitIgnore` is true', () => {
    const files = getIgnore({
      ignore: [],
      useGitIgnore: true,
      gitIgnoreFiles: []
    })
    expect(files).toStrictEqual(['.cache', '*.tgz', 'coverage/', 'dist/'])
  })

  it('should return an array of ignored files if `ignore` is provided', () => {
    const files = getIgnore({
      ignore: ['public/'],
      useGitIgnore: false,
      gitIgnoreFiles: []
    })
    expect(files).toStrictEqual(['public/'])
  })

  it('should return an array of ignored files if `.eslintignore` exists', () => {
    const eslintignorePath = path.join(cwd, '.eslintignore')
    fs.writeFileSync(eslintignorePath, 'coverage/\ndist/')

    const files = getIgnore({
      ignore: [],
      useGitIgnore: false,
      gitIgnoreFiles: []
    })
    expect(files).toStrictEqual(['coverage/', 'dist/'])

    fs.writeFileSync(eslintignorePath, '')
  })

  it('should merge objects recursively', () => {
    const obj = {
      cwd: '.',
      extensions: ['.js'],
      baseConfig: {
        ignorePatterns: [],
        env: { jest: false },
        noInlineConfig: true,
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
        settings: { semi: ['error'] }
      },
      useEslintrc: true
    }

    expect(mergeObj(obj, src)).toStrictEqual({
      cwd: '..',
      extensions: ['.js', '.ts'],
      baseConfig: {
        ignorePatterns: ['dist/'],
        env: { jest: true },
        noInlineConfig: true,
        settings: { semi: ['error'] }
      },
      useEslintrc: true
    })
  })

  it('should merge objects recursively with empty obj', () => {
    const obj = {}

    const src = {
      cwd: '..',
      extensions: ['.ts'],
      baseConfig: {
        ignorePatterns: ['dist/'],
        env: { jest: true },
        noInlineConfig: undefined,
        settings: { semi: ['error'] }
      },
      useEslintrc: true
    }

    expect(mergeObj(obj, src)).toStrictEqual(src)
  })

  it('should merge eslintOptions from parsed argv', () => {
    const options = new Options({ eslint })
    const { eslintOptions } = options

    const eslintOptionsCopy = Object.assign({}, eslintOptions)
    eslintOptionsCopy.baseConfig.globals = { jest: true }
    eslintOptionsCopy.extensions = eslintOptionsCopy.extensions.concat('.ts')

    const mergedOptions = mergeESLintOpsFromArgv(options, {
      ext: '.ts',
      globals: 'jest',
      _: []
    })
    expect(mergedOptions).toStrictEqual(eslintOptionsCopy)
  })

  it('should return cache location string', () => {
    const cachePath = getCacheLocation(DEFAULT_VERSION, DEFAULT_CMD)
    expect(cachePath).toBe(
      `${CACHE_HOME}/${DEFAULT_CMD}/v${DEFAULT_VERSION.substring(0, 1)}/`
    )
  })

  it('should return headline string', () => {
    const headline = getHeadline(DEFAULT_CMD, DEFAULT_TAGLINE, DEFAULT_HOMEPAGE)
    expect(headline).toBe(
      `${DEFAULT_CMD}: ${DEFAULT_TAGLINE} (${DEFAULT_HOMEPAGE})`
    )
  })

  it('should return help message', () => {
    const help = getHelp(DEFAULT_CMD, DEFAULT_EXTENSIONS)
    expect(help).toStrictEqual(
      expect.stringMatching(/^usage: standard-engine-ts/m)
    )
  })
})
