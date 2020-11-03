import fs from 'fs'
import path from 'path'
import findUp from 'find-up'
import { LinterOptions, ProvidedOptions } from './options'
import { MAJORVERSION_REGEX, CACHE_HOME, DEFAULT_IGNORE } from './constants'

const getRootPath = (): string =>
  findUp.sync(
    directory => {
      const hasPkgJson = findUp.sync.exists(
        path.join(directory, 'package.json')
      )
      return (hasPkgJson && directory) || undefined
    },
    { type: 'directory' }
  ) as string

const getReadFileFn = () => {
  const rootPath = getRootPath()

  return (file: string): string | null => {
    try {
      return fs.readFileSync(path.join(rootPath, file), 'utf-8')
    } catch {
      return null
    }
  }
}

export const getIgnore = ({
  ignore,
  useGitIgnore,
  gitIgnoreFiles = []
}: ProvidedOptions): string[] => {
  const readFile = getReadFileFn()
  type ExcludesNull = <T>(s: T | null) => s is T

  const gitignore = useGitIgnore
    ? ['.gitignore', '.git/info/exclude', ...gitIgnoreFiles]
        .map(file => readFile(file))
        // eslint-disable-next-line
        .filter((Boolean as any) as ExcludesNull)
        .map(text => text.split(/\r?\n/))
        .flat()
    : []

  return [...DEFAULT_IGNORE, ...(ignore || []), ...gitignore]
}

export const getCacheLocation = (version: string, cmd: string): string => {
  const versionMatch = version.match(MAJORVERSION_REGEX)
  const majorVersion = versionMatch && `${versionMatch[1]}`

  // Example: ~/.cache/standard-engine-ts/v0/
  const cacheLocation = path.join(
    CACHE_HOME,
    cmd,
    majorVersion ? `v${majorVersion}/` : ''
  )
  return cacheLocation
}

export const getHeadline = ({
  cmd,
  tagline,
  homepage
}: LinterOptions): string => `${cmd}: ${tagline} (${homepage})`

export const getHelp = ({ cmd, eslintOptions }: LinterOptions): string => {
  const extPatterns = eslintOptions.extensions.map(ext => '*' + ext).join(', ')

  return `
Usage:
    ${cmd} <flags> [FILES...]

    If FILES is omitted, all source files (${extPatterns})
    in the current working directory will be checked recursively.

    Certain paths (node_modules/, coverage/, vendor/, *.min.js, and
    files/folders that begin with '.' like .git/) are automatically ignored.

    Paths in a project's root .gitignore file are also automatically ignored.

Flags:
        --fix       Automatically fix problems
    -v, --verbose   Show rule names for errors (to ignore specific rules)
        --version   Show current version
    -h, --help      Show usage information

Flags (advanced):
        --stdin     Read file text from stdin
        --ext       Specify JavaScript file extensions
        --global    Declare global variable
        --plugin    Use custom eslint plugin
        --env       Use custom eslint environment
        --parser    Use custom js parser (e.g. babel-eslint)
`
}
