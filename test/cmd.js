#!/usr/bin/env node

const { cli } = require('..')
cli({ useGitIgnore: true, configFile: './.eslintrc.js' })
