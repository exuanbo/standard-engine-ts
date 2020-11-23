#!/usr/bin/env node
'use strict'

const path = require('path')
const eslint = require('eslint')
const { run } = require('..')

run({
  eslint,
  extensions: ['.ts'],
  configFile: path.join(__dirname, '../.eslintrc.js')
})
