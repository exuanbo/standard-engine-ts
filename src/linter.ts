import { ESLint as _ESLint } from 'eslint'
import type { ESLintOptions } from './options'

export type LintCallback = (
  err: unknown,
  result: _ESLint.LintResult[] | null,
  code?: string
) => void

export class Linter {
  private readonly ESLint: typeof _ESLint
  private readonly eslint: _ESLint
  public options: ESLintOptions

  constructor(ESLint: typeof _ESLint, options: ESLintOptions) {
    this.ESLint = ESLint
    this.eslint = new ESLint(options)
    this.options = options
  }

  lintText = async (code: string, cb?: LintCallback | string, filePath?: string): Promise<void> => {
    if (typeof cb === 'string') {
      return await this.lintText(code, undefined, cb)
    }
    try {
      const results = await this.eslint.lintText(code, { filePath })
      cb?.(null, results, code)
    } catch (err) {
      cb?.(err, null, code)
    }
  }

  lintFiles = async (files: string | string[], cb?: LintCallback): Promise<void> => {
    try {
      const results = await this.eslint.lintFiles(typeof files === 'string' ? [files] : files)
      if (this.options.fix === true) {
        await this.ESLint.outputFixes(results)
      }
      cb?.(null, results)
    } catch (err) {
      cb?.(err, null)
    }
  }
}
