import path from 'path'
import minimist from 'minimist'
import type { ESLint } from 'eslint'
import { LintCallback, Linter } from './linter'
import { ProvidedOptions, Options } from './options'
import {
  ParsedArgs,
  MINIMIST_OPTS,
  mergeOptionsFromArgv,
  readStdin,
  TerminalStyle
} from './cli-utils'

export abstract class CLIEngine {
  onFinish: LintCallback = (err, lintResults, code): void => {
    if (err === null) {
      this.onResult(lintResults!, code)
      return
    }
    this.onError(err)
  }

  protected abstract onError(err: unknown): void
  protected abstract onResult(res: ESLint.LintResult[], code?: string): void

  constructor(public linter: Linter, public options: Options) {}
}

export class CLI extends CLIEngine {
  argv: ParsedArgs

  constructor(providedOptions: ProvidedOptions) {
    const options = new Options(providedOptions)

    const argv = minimist(process.argv.slice(2), MINIMIST_OPTS)
    mergeOptionsFromArgv(options, argv)

    const linter = new Linter(options.ESLint, options.eslintOptions)

    super(linter, options)
    this.argv = argv
  }

  protected onError(err: unknown): void {
    const { cmd, bugs } = this.options
    console.error(
      `${cmd}: Unexpected linter output:

${err instanceof Error ? err.stack ?? err.message : err}

If you think this is a bug in \`${cmd}\`, open an issue: ${bugs}`
    )
    process.exitCode = 1
  }

  protected onResult(lintResults: ESLint.LintResult[], code?: string): void {
    const shouldFixStdin = this.argv.stdin === true && this.argv.fix === true

    if (shouldFixStdin) {
      const [{ output }] = lintResults
      process.stdout.write(output ?? code!)
    }

    const cwd = process.cwd()

    const log = shouldFixStdin
      ? (message: string): void => {
          console.error(`\n${message}`)
        }
      : console.log

    let isFixable = false
    let totalErrorCount = 0

    lintResults.forEach(({ filePath, messages: lintMessage, errorCount }) => {
      lintMessage.forEach(({ column, line, ruleId, message, fatal, severity, fix }) => {
        const report = `${TerminalStyle.Underline}${path.relative(
          cwd,
          filePath
        )}:${line}:${column}${TerminalStyle.Reset}\n  ${
          fatal === true || severity === 2
            ? `${TerminalStyle.Red}error${TerminalStyle.Reset}`
            : `${TerminalStyle.Yellow}warning${TerminalStyle.Reset}`
        }  ${message}  ${
          ruleId !== null ? `${TerminalStyle.BrightBlack}${ruleId}${TerminalStyle.Reset}` : ''
        }\n`

        log(report)
        if (fix !== undefined) {
          isFixable = true
        }
      })
      totalErrorCount += errorCount
    })

    if (isFixable) {
      log(`Run \`${this.options.cmd} --fix\` to automatically fix some problems.\n`)
    }
    process.exitCode = totalErrorCount > 0 ? 1 : 0
  }
}

export const run = async (providedOptions: ProvidedOptions): Promise<void> => {
  const { argv, onFinish, linter, options } = new CLI(providedOptions)
  const { cmd, version, tagline, homepage, eslintOptions } = options

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
