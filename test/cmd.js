#!/usr/bin/env node

const path = require('path')
const { cli } = require('..')

cli({
  extensions: ['.ts'],
  configFile: path.join(__dirname, '..', '.eslintrc.js'),
  useGitIgnore: true
})
