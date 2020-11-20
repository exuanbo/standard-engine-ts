import os from 'os'
import xdgBasedir from 'xdg-basedir'
import { name, version, description, homepage, bugs } from '../package.json'

export const DEFAULT_CMD = name

export const DEFAULT_VERSION = version

export const DEFAULT_TAGLINE = description

export const DEFAULT_HOMEPAGE = homepage

export const DEFAULT_BUGS = bugs.url

export const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs']

export const MAJORVERSION_REGEX = /^(\d+)\./

export const CACHE_HOME = xdgBasedir.cache ?? os.tmpdir()

export const DEFAULT_IGNORE = ['dist/', 'coverage/']

export const DEFAULT_GITIGNORE = ['.gitignore', '.git/info/exclude']
