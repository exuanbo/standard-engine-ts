#!/usr/bin/env node
'use strict'

const path = require('path')
const { ESLint } = require('eslint')
const { run } = require('..')

run({
  ESLint,
  extensions: ['.ts'],
  configFile: path.join(__dirname, '../.eslintrc.js')
})
