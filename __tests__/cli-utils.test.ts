import eslint from 'eslint'
import { Options } from '../src/options'
import { mergeOptionsFromArgv, readStdin } from '../src/cli-utils'

describe('mergeESLintOpsFromArgv', () => {
  it('should merge eslintOptions from parsed argv', () => {
    const options = new Options({ eslint })

    const eslintOptionsCopy = Object.assign({}, options.eslintOptions)
    eslintOptionsCopy.extensions = eslintOptionsCopy.extensions.concat('.ts')
    eslintOptionsCopy.baseConfig.globals = { jest: true }
    eslintOptionsCopy.baseConfig.ignorePatterns = [
      '.cache',
      '*.tgz',
      'coverage/',
      'dist/'
    ]

    mergeOptionsFromArgv(options, {
      ext: '.ts',
      globals: 'jest',
      _: []
    })
    expect(options.eslintOptions).toStrictEqual(eslintOptionsCopy)
  })
})

describe('readStdin', () => {
  it('should read stdin', async () => {
    const stdin = readStdin()

    process.stdin.push('std')
    process.stdin.push('in')
    await new Promise(resolve => setTimeout(resolve, 1))
    process.stdin.emit('end')

    expect(await stdin).toBe('stdin')
  })
})
