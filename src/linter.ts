import eslint, { ESLint } from 'eslint'
import { Options, LinterOptions, ProvidedOptions } from './options'

type LintCallback = (err: Error | null, result?: ESLint.LintResult[]) => void

export class Linter {
  eslint: typeof eslint
  options: LinterOptions

  constructor(opts: ProvidedOptions) {
    this.eslint = opts.eslint || eslint
    this.options = new Options(opts)
  }

  lintText(code: string, filePath?: string): Promise<ESLint.LintResult[]> {
    return new this.eslint.ESLint(this.options.eslintOptions).lintText(code, {
      filePath
    })
  }

  lintTextSync(code: string, cb: LintCallback, filePath?: string): void {
    try {
      const results = this.lintText(code, filePath)
      process.nextTick(cb, null, results)
    } catch (err) {
      return process.nextTick(cb, err)
    }
  }

  async lintFiles(files: string | string[], cb: LintCallback): Promise<void> {
    try {
      const results = await new this.eslint.ESLint(
        this.options.eslintOptions
      ).lintFiles(files)

      if (this.options.eslintOptions.fix) {
        await this.eslint.ESLint.outputFixes(results)
      }

      cb(null, results)
    } catch (err) {
      return cb(err)
    }
  }
}
