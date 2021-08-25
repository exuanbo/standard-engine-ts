import { ESLint as _ESLint } from 'eslint'
import type { ESLintOptions } from './options'

export type LintCallback = <T extends Error | null>(
  err: T,
  result: T extends Error ? null : _ESLint.LintResult[],
  code?: string
) => void

const handleResults = (
  cb: LintCallback | undefined,
  results: _ESLint.LintResult[],
  code?: string
): undefined | typeof results => {
  if (cb !== undefined) {
    cb(null, results, code)
    return
  }
  return results
}

const handleError = (cb: LintCallback | undefined, err: Error): void => {
  if (cb !== undefined) {
    cb(err, null)
    return
  }
  throw err
}

export class Linter {
  private readonly eslint: _ESLint
  private readonly ESLint: typeof _ESLint
  public options: ESLintOptions

  constructor(ESLint: typeof _ESLint, options: ESLintOptions) {
    this.ESLint = ESLint
    this.options = options
    this.eslint = new ESLint(options)
  }

  lintText = async (
    code: string,
    cb?: LintCallback | string,
    filePath?: string
  ): Promise<_ESLint.LintResult[] | undefined> => {
    if (typeof cb === 'string') {
      return await this.lintText(code, undefined, cb)
    }

    try {
      const results = await this.eslint.lintText(code, { filePath })

      return handleResults(cb, results, code)
    } catch (err) {
      handleError(cb, err)
    }
  }

  lintFiles = async (
    files: string | string[],
    cb?: LintCallback
  ): Promise<_ESLint.LintResult[] | undefined> => {
    try {
      const results = await this.eslint.lintFiles(files)

      if (this.options.fix === true) {
        await this.ESLint.outputFixes(results)
      }

      return handleResults(cb, results)
    } catch (err) {
      handleError(cb, err)
    }
  }
}
