import { ESLint } from 'eslint'
import { copy } from 'copy-anything'
import { Options } from '../src/options'
import { mergeOptionsFromArgv, readStdin } from '../src/cli-utils'

describe('mergeESLintOpsFromArgv', () => {
  it('should merge eslintOptions from parsed argv', () => {
    const options = new Options({ ESLint })

    const eslintOptionsCopy = copy(options.eslintOptions)
    eslintOptionsCopy.extensions.push('.ts')
    eslintOptionsCopy.baseConfig.globals = { jest: true }
    eslintOptionsCopy.baseConfig.ignorePatterns = ['.cache', '*.tgz', 'coverage/', 'dist/']

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
    await new Promise<void>(resolve => setTimeout(resolve, 0))
    process.stdin.emit('end')

    expect(await stdin).toBe('stdin')
  })
})
