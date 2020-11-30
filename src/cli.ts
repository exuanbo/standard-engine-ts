import minimist from 'minimist'
import getStdin from 'get-stdin'
import { ESLint, Linter as ESLinter } from 'eslint'
import { LintCallback, Linter } from './linter'
import { LinterOptions, ProvidedOptions } from './options'
import {
  MINIMIST_OPTS,
  ParsedArgs,
  mergeOptionsFromArgv,
  getHeadline,
  getHelp
} from './cli-utils'

export abstract class CLIEngine<T> {
  options: LinterOptions

  protected abstract onError(err: Error): void
  protected abstract onResult(res: ESLint.LintResult[], code?: string): void

  constructor(public argv: T, public linter: Linter) {
    this.options = linter.options
  }
}

export class CLI extends CLIEngine<ParsedArgs> {
  onFinish: LintCallback

  constructor(opts: ProvidedOptions) {
    const minimistOpts = MINIMIST_OPTS
    const argv = minimist(process.argv.slice(2), minimistOpts) as ParsedArgs

    const linter = new Linter(opts)
    const { options } = linter

    options.eslintOptions = mergeOptionsFromArgv(options, argv)

    super(argv, linter)

    this.onFinish = (err, lintResults, code): void => {
      if (err instanceof Error) {
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
    const { cmd } = this.options

    if (
      this.argv.stdin === true &&
      this.argv.fix === true &&
      code !== undefined
    ) {
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

    lintResults.forEach(
      ({
        messages,
        filePath
      }: Pick<ESLint.LintResult, 'messages' | 'filePath'>) =>
        messages.forEach(
          ({ line, column, message, ruleId }: ESLinter.LintMessage, index) => {
            const isLast = index === messages.length - 1
            const report = `${filePath}:${line}:${column}: ${message}${
              this.argv.verbose === true && ruleId !== null
                ? ` (${ruleId})`
                : ''
            }${isLast ? '\n' : ''}`
            console.log(report)
          }
        )
    )

    const isFixable = lintResults.some(res =>
      res.messages.some(msg => Boolean(msg.fix))
    )
    if (isFixable) {
      console.log(`Run \`${cmd} --fix\` to automatically fix some problems.\n`)
    }

    process.exitCode = errorCount > 0 ? 1 : 0
  }
}

export const run = async (opts: ProvidedOptions): Promise<void> => {
  const cli = new CLI(opts)
  const { argv, options, linter, onFinish } = cli
  const { cmd, tagline, homepage, eslintOptions } = options

  if (argv.help === true) {
    console.log(getHeadline(cmd, tagline, homepage))
    console.log(getHelp(cmd, eslintOptions.extensions))
    return
  }

  if (argv.version === true) {
    console.log(`${options.cmd}: v${options.version}`)
    return
  }

  // Unix convention: Command line argument `-` is a shorthand for `--stdin`
  if (argv._[0] === '-') {
    argv.stdin = true
    argv._.shift()
  }

  if (argv.stdin === true) {
    const stdin = await getStdin()
    await linter.lintText(stdin, onFinish)
    return
  }

  await linter.lintFiles(argv._.length > 0 ? argv._ : ['.'], onFinish)
}
