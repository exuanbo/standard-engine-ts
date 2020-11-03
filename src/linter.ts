import { ESLint } from 'eslint'
import { Options, LinterOptions, ProvidedOptions } from './options'

type LintCallback = (err: Error | null, result?: ESLint.LintResult[]) => void

export class Linter {
  eslint: ProvidedOptions['eslint']
  options: LinterOptions

  constructor(opts: ProvidedOptions) {
    this.eslint = opts.eslint
    this.options = new Options(opts)
  }

  async lintText(
    code: string,
    cb?: LintCallback | string,
    filePath?: string
  ): Promise<void | ESLint.LintResult[]> {
    if (typeof cb === 'string') {
      return this.lintText(code, undefined, cb)
    }

    try {
      const results = await new this.eslint.ESLint(
        this.options.eslintOptions
      ).lintText(code, {
        filePath
      })

      if (cb) {
        return cb(null, results)
      }
      return results
    } catch (err) {
      if (cb && typeof cb === 'function') {
        return cb(err)
      }
      throw err
    }
  }

  async lintFiles(
    files: string | string[],
    cb?: LintCallback
  ): Promise<void | ESLint.LintResult[]> {
    try {
      const results = await new this.eslint.ESLint(
        this.options.eslintOptions
      ).lintFiles(files)

      if (this.options.eslintOptions.fix) {
        await this.eslint.ESLint.outputFixes(results)
      }

      if (cb) {
        return cb(null, results)
      }
      return results
    } catch (err) {
      if (cb) {
        return cb(err)
      }
      throw err
    }
  }
}
