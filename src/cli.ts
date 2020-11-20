import minimist from 'minimist'
import getStdin from 'get-stdin'
import { ESLint, Linter as ESLinter } from 'eslint'
import { LintCallback, Linter } from './linter'
import { LinterOptions, ProvidedOptions } from './options'
import {
  MINIMIST_OPTS,
  ParsedArgs,
  mergeESLintOpsFromArgv,
  getHeadline,
  getHelp
} from './cli-utils'

export abstract class CLIEngine<T> {
  abstract linter: Linter
  abstract onFinish: LintCallback

  protected abstract onError(err: Error): void
  protected abstract onResult(res: ESLint.LintResult[], code?: string): void
  protected abstract report(...args: unknown[]): void

  constructor(public options: LinterOptions, public argv: T) {}
}

export class CLI extends CLIEngine<Required<ParsedArgs>> {
  linter: Linter
  onFinish: LintCallback

  constructor(opts: ProvidedOptions) {
    const linter = new Linter(opts)
    const { options } = linter

    const minimistOpts = MINIMIST_OPTS

    const argv = minimist(process.argv.slice(2), minimistOpts)

    options.eslintOptions = mergeESLintOpsFromArgv(options, argv)

    super(options, argv as Required<ParsedArgs>)

    this.linter = linter
    this.onFinish = (
      err: Error | null,
      lintResults: ESLint.LintResult[] | null,
      code?: string
    ): void => {
      if (err !== null) {
        this.onError(err)
        return
      }
      this.onResult(lintResults as ESLint.LintResult[], code)
    }
  }

  protected onError(err: Error): void {
    const { cmd, bugs } = this.options
    const { stack, message } = err

    console.error(`${cmd}: Unexpected linter output:\n`)
    console.error(stack ?? message)
    console.error(
      `\nIf you think this is a bug in \`${cmd}\`, open an issue: ${bugs}`
    )
    process.exitCode = 1
  }

  protected onResult(lintResults: ESLint.LintResult[], code?: string): void {
    const { cmd, tagline, homepage } = this.options

    if (this.argv.stdin && this.argv.fix && code !== undefined) {
      const [{ output }] = lintResults
      process.stdout.write(output ?? code)
      return
    }

    const count = (
      complainType: Extract<
        keyof ESLint.LintResult,
        'errorCount' | 'warningCount'
      >
    ): number =>
      lintResults.map(res => res[complainType]).reduce((acc, cur) => acc + cur)

    const errorCount = count('errorCount')

    if (errorCount + count('warningCount') === 0) {
      return
    }

    console.log(`${getHeadline(cmd, tagline, homepage)}\n`)

    const isFixable = lintResults.some(res =>
      res.messages.some(msg => Boolean(msg.fix))
    )
    if (isFixable) {
      console.log(
        `  Run \`${cmd} --fix\` to automatically fix some problems.\n`
      )
    }

    lintResults.forEach(
      ({
        messages,
        filePath
      }: Pick<ESLint.LintResult, 'messages' | 'filePath'>) =>
        messages.forEach(
          ({ line, column, message, ruleId }: ESLinter.LintMessage, index) => {
            const isLast = index === messages.length - 1
            this.report(
              isLast,
              '  %s:%d:%d: %s%s',
              filePath,
              line,
              column,
              message,
              this.argv.verbose && ruleId !== null ? ` (${ruleId})` : ''
            )
          }
        )
    )

    process.exitCode = errorCount > 0 ? 1 : 0
  }

  protected report(
    isLast: boolean,
    ...args: [string, string, number, number, string, string]
  ): void {
    if (this.argv.stdin && this.argv.fix) {
      args[0] = `${this.options.cmd}: ${args[0]}`
    }
    console.error(...args, isLast ? '\n' : '')
  }
}

export const run = (opts: ProvidedOptions): void => {
  const cli = new CLI(opts)
  const { options, argv, linter, onFinish } = cli
  const { cmd, tagline, homepage, eslintOptions } = options

  // Unix convention: Command line argument `-` is a shorthand for `--stdin`
  if (argv._[0] === '-') {
    argv.stdin = true
    argv._.shift()
  }

  if (argv.help) {
    console.log(getHeadline(cmd, tagline, homepage))
    console.log(getHelp(cmd, eslintOptions.extensions))
    return
  }

  if (argv.version) {
    console.log(`${options.cmd}: v${options.version}`)
    return
  }

  /* eslint no-void: ["error", { "allowAsStatement": true }] */

  if (argv.stdin) {
    void getStdin().then(async text => await linter.lintText(text, onFinish))
    return
  }

  void linter.lintFiles(argv._.length > 0 ? argv._ : ['.'], onFinish)
}
