#!/usr/bin/env node
'use strict'

const path = require('path')
const eslint = require('eslint')
const { cli } = require('..')

cli({
  eslint,
  extensions: ['.ts'],
  configFile: path.join(__dirname, '..', '.eslintrc.js'),
  useGitIgnore: true
})
