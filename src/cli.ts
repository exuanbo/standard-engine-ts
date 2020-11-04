import minimist, { ParsedArgs } from 'minimist'
import getStdin from 'get-stdin'
import { ESLint, Linter as ESLinter } from 'eslint'
import mergeWith from 'lodash.mergewith'
import { Linter } from './linter'
import { ESLintOptions, LinterOptions, ProvidedOptions } from './options'
import { customizeArrayMerge, getHeadline, getHelp } from './utils'

export const cli = (opts: ProvidedOptions): void => {
  const linter = new Linter(opts)
  const { options } = linter

  const argv = minimist(process.argv.slice(2), {
    alias: {
      env: 'envs',
      globals: 'global',
      plugins: 'plugin',
      help: 'h',
      version: 'v'
    },
    boolean: ['fix', 'verbose', 'version', 'help', 'stdin'],
    string: ['env', 'globals', 'plugins', 'parser', 'ext']
  })

  options.eslintOptions = mergeESLintOps(options, argv)

  // Unix convention: Command line argument `-` is a shorthand for `--stdin`
  if (argv._[0] === '-') {
    argv.stdin = true
    argv._.shift()
  }

  if (argv.help) {
    console.log(getHeadline(options))
    console.log(getHelp(options))
    return
  }

  if (argv.version) {
    console.log(`${options.cmd}: v${options.version}`)
    return
  }

  let stdinText: string

  if (argv.stdin) {
    getStdin().then(text => {
      stdinText = text
      linter.lintText(text, onFinish)
    })
  } else {
    linter.lintFiles(argv._.length ? argv._ : ['.'], onFinish)
  }

  function mergeESLintOps(
    { eslintOptions }: LinterOptions,
    {
      ext = [],
      env = {},
      globals = {},
      parser = '',
      plugins = [],
      fix = false
    }: ParsedArgs
  ): ESLintOptions {
    const optionsFromArgs: Partial<LinterOptions['eslintOptions']> = {
      extensions: ext,
      baseConfig: {
        env,
        globals,
        parser,
        plugins
      },
      fix
    }
    return mergeWith(eslintOptions, optionsFromArgs, customizeArrayMerge)
  }

  function onFinish(
    err: Error | null,
    lintResults?: ESLint.LintResult[]
  ): void {
    if (err) {
      onError(err)
      return
    }
    if (lintResults) {
      onResult(lintResults)
    }
  }

  function onError(err: Error): void {
    console.error(`${options.cmd}: Unexpected linter output:\n`)
    console.error(err.stack || err.message || err)
    console.error(
      `\nIf you think this is a bug in \`${options.cmd}\`, open an issue: ${options.bugs}`
    )
    process.exitCode = 1
  }

  function onResult(lintResults: ESLint.LintResult[]): void {
    if (argv.stdin && argv.fix) {
      const [{ output }] = lintResults
      process.stdout.write(output || stdinText)
      return
    }

    const count = (
      complainType: Extract<
        keyof ESLint.LintResult,
        'errorCount' | 'warningCount'
      >
    ) =>
      lintResults.map(res => res[complainType]).reduce((acc, cur) => acc + cur)

    const errorCount = count('errorCount')

    if (errorCount + count('warningCount') === 0) {
      return
    }

    console.log(`${getHeadline(options)}\n`)

    const isFixable = lintResults.some(res =>
      res.messages.some(msg => Boolean(msg.fix))
    )

    if (isFixable) {
      console.error(
        `  Run \`${options.cmd} --fix\` to automatically fix some problems.\n`
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
            log(
              isLast,
              '  %s:%d:%d: %s%s',
              filePath,
              line,
              column,
              message,
              argv.verbose && ruleId ? ` (${ruleId})` : ''
            )
          }
        )
    )

    process.exitCode = errorCount ? 1 : 0
  }

  function log(
    isLast: boolean,
    ...args: [string, string, number, number, string, string]
  ) {
    if (argv.stdin && argv.fix) {
      args[0] = `${options.cmd}: ${args[0]}`
    }
    console.error(...args, isLast ? '\n' : '')
  }
}
