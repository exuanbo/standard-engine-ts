import path from 'path'
import minimist from 'minimist'
import { ESLint } from 'eslint'
import { LintCallback, Linter } from './linter'
import { ProvidedOptions } from './options'
import {
  MINIMIST_OPTS,
  ParsedArgs,
  mergeOptionsFromArgv,
  readStdin,
  TerminalStyle
} from './cli-utils'

export abstract class CLIEngine<T> {
  onFinish: LintCallback
  protected abstract onError(err: Error): void
  protected abstract onResult(res: ESLint.LintResult[], code?: string): void

  constructor(public argv: T, public linter: Linter) {
    this.onFinish = (err, lintResults, code): void => {
      if (err instanceof Error) {
        this.onError(err)
        return
      }
      this.onResult(lintResults as ESLint.LintResult[], code)
    }
  }
}

export class CLI extends CLIEngine<ParsedArgs> {
  constructor(opts: ProvidedOptions) {
    const minimistOpts = MINIMIST_OPTS
    const argv = minimist(process.argv.slice(2), minimistOpts) as ParsedArgs

    const linter = new Linter(opts)
    const { options } = linter

    options.eslintOptions = mergeOptionsFromArgv(options, argv)

    super(argv, linter)
  }

  protected onError(err: Error): void {
    const { cmd, bugs } = this.linter.options
    const { stack, message } = err

    console.error(`${cmd}: Unexpected linter output:\n`)
    console.error(stack ?? message)
    console.error(
      `\nIf you think this is a bug in \`${cmd}\`, open an issue: ${bugs}`
    )
    process.exitCode = 1
  }

  protected onResult(lintResults: ESLint.LintResult[], code?: string): void {
    const { cmd } = this.linter.options

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

    lintResults.forEach(({ messages: lintMessage, filePath }) => {
      lintMessage.forEach(
        ({ column, line, ruleId, message, fatal, severity }) => {
          const report = `${TerminalStyle.Underline}${path.relative(
            process.cwd(),
            filePath
          )}:${line}:${column}${TerminalStyle.Reset}\n  ${
            fatal === true || severity === 2
              ? `${TerminalStyle.Red}error${TerminalStyle.Reset}`
              : `${TerminalStyle.Yellow}warning${TerminalStyle.Reset}`
          }  ${message}  ${
            ruleId !== null
              ? `${TerminalStyle.BrightBlack}${ruleId}${TerminalStyle.Reset}`
              : ''
          }\n`

          console.log(report)
        }
      )
    })

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
  const { argv, linter, onFinish } = new CLI(opts)
  const { cmd, version, tagline, homepage, eslintOptions } = linter.options

  if (argv.help === true) {
    console.log(`${cmd}: ${tagline} (${homepage})`)
    console.log(`
Usage: ${cmd} <flags> [FILES...]

  If FILES is omitted, all source files (${eslintOptions.extensions
    .map(ext => `*${ext}`)
    .join(', ')})
  in the current working directory will be checked recursively.

  By default, files/folders that begin with '.' like .eslintrc .cache/ and
  paths in .gitignore are automatically ignored.

Basic:
  --fix                Automatically fix problems

Config:
  --env                Use custom eslint environment
  --ext                Specify file extensions
  --global             Declare global variable
  --parser             Use custom parser (e.g. babel-eslint)
  --plugin             Use custom eslint plugin

Input:
  --stdin              Read file text from stdin
  --disable-gitignore  Disable use of .gitignore by default

Misc:
  -h, --help           Show usage information
  -v, --version        Show current version
`)
    return
  }

  if (argv.version === true) {
    console.log(`${cmd}: v${version}`)
    return
  }

  // Unix convention: Command line argument `-` is a shorthand for `--stdin`
  if (argv._[0] === '-') {
    argv.stdin = true
    argv._.shift()
  }

  if (argv.stdin === true) {
    const stdin = await readStdin()
    await linter.lintText(stdin, onFinish)
    return
  }

  await linter.lintFiles(argv._.length > 0 ? argv._ : ['.'], onFinish)
}
