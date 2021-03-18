import eslint, { ESLint } from 'eslint'
import { Options, LinterOptions, ProvidedOptions } from './options'

export type LintCallback = <T extends Error | null>(
  err: T,
  result: T extends Error ? null : ESLint.LintResult[],
  code?: string
) => void

const handleResults = (
  cb: LintCallback | undefined,
  results: ESLint.LintResult[],
  code?: string
): undefined | typeof results => {
  if (cb !== undefined) {
    cb(null, results, code)
    return
  }
  return results
}

const handleError = (
  cb: LintCallback | undefined,
  err: Error
): void | never => {
  if (cb !== undefined) {
    cb(err, null)
    return
  }
  throw err
}

export class Linter {
  options: LinterOptions
  private readonly eslint: typeof eslint

  constructor(opts: ProvidedOptions) {
    this.options = new Options(opts)
    this.eslint = opts.eslint
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
      ).lintText(code, { filePath })
      return handleResults(cb, results, code)
    } catch (err) {
      handleError(cb, err)
    }
  }

  lintFiles = async (
    files: string | string[],
    cb?: LintCallback
  ): Promise<ESLint.LintResult[] | undefined> => {
    const { eslintOptions } = this.options

    try {
      const results = await new this.eslint.ESLint(
        this.options.eslintOptions
      ).lintFiles(files)

      if (eslintOptions.fix === true) {
        await this.eslint.ESLint.outputFixes(results)
      }

      return handleResults(cb, results)
    } catch (err) {
      handleError(cb, err)
    }
  }
}
