import { ESLint } from 'eslint'
import { Options, LinterOptions, ProvidedOptions } from './options'

export type LintCallback = <T extends Error | null>(
  err: T,
  result: T extends Error ? null : ESLint.LintResult[],
  code?: string
) => void

export class Linter {
  eslint: ProvidedOptions['eslint']
  options: LinterOptions

  constructor(opts: ProvidedOptions) {
    this.eslint = opts.eslint
    this.options = new Options(opts)
  }

  lintText = async (
    code: string,
    cb?: LintCallback | string,
    filePath?: string
  ): Promise<ESLint.LintResult[] | undefined> => {
    if (typeof cb === 'string') {
      return await this.lintText(code, undefined, cb)
    }

    try {
      const results = await new this.eslint.ESLint(
        this.options.eslintOptions
      ).lintText(code, {
        filePath
      })

      if (cb !== undefined) {
        cb(null, results, code)
        return undefined
      }
      return results
    } catch (err) {
      if (cb !== undefined && typeof cb === 'function') {
        cb(err, null)
        return undefined
      }
      throw err
    }
  }

  lintFiles = async (
    files: string | string[],
    cb?: LintCallback
  ): Promise<ESLint.LintResult[] | undefined> => {
    try {
      const results = await new this.eslint.ESLint(
        this.options.eslintOptions
      ).lintFiles(files)

      if (this.options.eslintOptions.fix !== undefined) {
        await this.eslint.ESLint.outputFixes(results)
      }

      if (cb !== undefined) {
        cb(null, results)
        return undefined
      }
      return results
    } catch (err) {
      if (cb !== undefined) {
        cb(err, null)
        return undefined
      }
      throw err
    }
  }
}
