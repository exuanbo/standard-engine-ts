#!/usr/bin/env node

const { cli } = require('..')
cli({ extensions: ['.ts'], configFile: './.eslintrc.js', useGitIgnore: true })
