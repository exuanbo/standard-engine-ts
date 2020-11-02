import os from 'os'
import xdgBasedir from 'xdg-basedir'

export const DEFAULT_CMD = 'standard-engine-ts'

export const DEFAULT_VERSION = '0.0.0'

export const DEFAULT_TAGLINE = 'TypeScript Standard Style'

export const DEFAULT_HOMEPAGE = 'https://github.com/exuanbo/standard-engine-ts'

export const DEFAULT_BUGS = `${DEFAULT_HOMEPAGE}/issues`

export const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']

export const MAJORVERSION_REGEX = /^(\d+)\./

export const CACHE_HOME = xdgBasedir.cache || os.tmpdir()

export const DEFAULT_IGNORE = [
  '**/*.min.js',
  'coverage/**',
  'node_modules/**',
  'vendor/**'
]
