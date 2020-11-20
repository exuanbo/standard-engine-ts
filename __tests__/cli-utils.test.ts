import eslint from 'eslint'
import { Options } from '../src/options'
import { mergeESLintOpsFromArgv, getHeadline, getHelp } from '../src/cli-utils'
import {
  DEFAULT_CMD,
  DEFAULT_TAGLINE,
  DEFAULT_HOMEPAGE,
  DEFAULT_EXTENSIONS
} from '../src/constants'

describe('mergeESLintOpsFromArgv', () => {
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
})

describe('string utils', () => {
  it('should return headline string', () => {
    const headline = getHeadline(DEFAULT_CMD, DEFAULT_TAGLINE, DEFAULT_HOMEPAGE)
    expect(headline).toBe(
      `\n${DEFAULT_CMD}: ${DEFAULT_TAGLINE} (${DEFAULT_HOMEPAGE})`
    )
  })

  it('should return help message', () => {
    const help = getHelp(DEFAULT_CMD, DEFAULT_EXTENSIONS)
    expect(help).toStrictEqual(
      expect.stringMatching(/^usage: standard-engine-ts/m)
    )
  })
})
