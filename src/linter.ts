import eslint, { ESLint } from 'eslint'
import { Options, LinterOptions, ProvidedOptions } from './options'

export type LintCallback = <T extends Error | null>(
  err: T,
  result: T extends Error ? null : ESLint.LintResult[],
  code?: string
) => void

export class Linter {
  options: LinterOptions
  private readonly eslint: typeof eslint
  private readonly ESLint: InstanceType<typeof ESLint>

  constructor(opts: ProvidedOptions) {
    this.options = new Options(opts)
    this.eslint = opts.eslint
    this.ESLint = new opts.eslint.ESLint(this.options.eslintOptions)
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
      const results = await this.ESLint.lintText(code, { filePath })
      if (cb !== undefined) {
        cb(null, results, code)
        return
      }
      return results
    } catch (err) {
      if (cb !== undefined && typeof cb === 'function') {
        cb(err, null)
        return
      }
      throw err
    }
  }

  lintFiles = async (
    files: string | string[],
    cb?: LintCallback
  ): Promise<ESLint.LintResult[] | undefined> => {
    const { eslintOptions } = this.options

    try {
      const results = await this.ESLint.lintFiles(files)

      if (eslintOptions.fix === true) {
        await this.eslint.ESLint.outputFixes(results)
      }

      if (cb !== undefined) {
        cb(null, results)
        return
      }
      return results
    } catch (err) {
      if (cb !== undefined) {
        cb(err, null)
        return
      }
      throw err
    }
  }
}
