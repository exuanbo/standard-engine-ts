import fs from 'fs'
import path from 'path'
import eslint from 'eslint'
import { Options } from '../src/options'
import {
  isDirHas,
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

describe('utils', () => {
  it('should return true if dir has file', () => {
    expect(isDirHas('.', 'package.json')).toBe(true)
  })

  it('should return the repository root path', () => {
    expect(getRootPath()).toBe(process.cwd())
  })

  it('should read files from the repository root path', () => {
    const readFile = getReadFileFromRootFn()
    const licenseContents = fs.readFileSync(
      path.join(process.cwd(), 'LICENSE'),
      'utf-8'
    )
    expect(readFile('LICENSE')).toBe(licenseContents)
  })

  it('should return null if no such file exists', () => {
    const readFile = getReadFileFromRootFn()
    expect(readFile('foo_bar')).toEqual(null)
  })

  it('should return an array of ignored files if `useGitIgnore` is true', () => {
    const files = getIgnore({
      ignore: [],
      useGitIgnore: true,
      gitIgnoreFiles: []
    })
    expect(files).toEqual(['.cache', '*.tgz', 'coverage/', 'dist/'])
  })

  it('should return an array of ignored files if `ignore` is provided', () => {
    const files = getIgnore({
      ignore: ['public/'],
      useGitIgnore: false,
      gitIgnoreFiles: []
    })
    expect(files).toEqual(['public/'])
  })

  it('should merge objects recursively', () => {
    const obj = {
      cwd: '.',
      extensions: ['.js'],
      baseConfig: {
        ignorePatterns: ['dist/'],
        env: { jest: false },
        noInlineConfig: true,
        settings: { semi: ['error'] }
      },
      useEslintrc: false
    }

    const src = {
      cwd: '..',
      extensions: ['.ts'],
      baseConfig: {
        ignorePatterns: ['coverage/'],
        env: { jest: true },
        noInlineConfig: false,
        settings: { semi: ['error', 'always'] }
      },
      useEslintrc: true
    }

    expect(mergeObj(obj, src)).toEqual({
      cwd: '..',
      extensions: ['.js', '.ts'],
      baseConfig: {
        ignorePatterns: ['dist/', 'coverage/'],
        env: { jest: true },
        noInlineConfig: false,
        settings: { semi: ['error', 'always'] }
      },
      useEslintrc: true
    })
  })

  it('should merge eslintOptions from parsed argv', () => {
    const options = new Options({ eslint, fix: false })
    const { eslintOptions } = options

    const copy = Object.assign({}, eslintOptions)
    copy.baseConfig.globals = { jest: true }
    copy.extensions = copy.extensions.concat('.ts')

    mergeESLintOpsFromArgv(options, {
      _: [],
      ext: ['.ts'],
      globals: { jest: true }
    })
    expect(options.eslintOptions).toEqual(copy)
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
    expect(help).toEqual(expect.stringMatching(/^usage: standard-engine-ts/m))
  })
})
