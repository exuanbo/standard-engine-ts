import type { ESLint } from 'eslint'
import eslint from 'eslint'
import type { ESLintOptions } from './options'

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
  private readonly eslint: ESLint

  constructor(
    private readonly ESLint: typeof eslint.ESLint,
    public options: ESLintOptions
  ) {
    this.eslint = new ESLint(options)
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
      const results = await this.eslint.lintText(code, { filePath })

      return handleResults(cb, results, code)
    } catch (err) {
      handleError(cb, err)
    }
  }

  lintFiles = async (
    files: string | string[],
    cb?: LintCallback
  ): Promise<ESLint.LintResult[] | undefined> => {
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
