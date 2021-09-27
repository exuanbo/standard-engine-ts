#!/usr/bin/env node
'use strict'

const path = require('path')
const { ESLint } = require('eslint')
const { run } = require('..')

run({
  ESLint,
  eslintOptions: { useEslintrc: false },
  extensions: ['.ts'],
  configFile: path.join(__dirname, '../node_modules/ts-standardx/.eslintrc.js')
})
