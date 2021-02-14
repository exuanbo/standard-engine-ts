# standard-engine-ts

> Yet another ESLint wrapper written in TypeScript.

[![npm](https://img.shields.io/npm/v/standard-engine-ts)](https://www.npmjs.com/package/standard-engine-ts)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/exuanbo/standard-engine-ts/Node.js%20CI/main)](https://github.com/exuanbo/standard-engine-ts/actions?query=workflow%3A%22Node.js+CI%22)
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

Used by [ts-standardx](https://github.com/exuanbo/ts-standardx).

## Features

Todo

## Install

```sh
npm install standard-engine-ts
```

## Usage

```js
#!/usr/bin/env node
'use strict'

const path = require('path')
const eslint = require('eslint')
const { run } = require('standard-engine-ts')
const {
  name,
  version,
  description,
  homepage,
  bugs
} = require('../package.json')

run({
  cmd: name,
  version,
  tagline: description,
  homepage,
  bugs: bugs.url,
  eslint,
  extensions: ['.ts'],
  configFile: path.join(__dirname, '../.eslintrc.js')
})
```

## API

See bundled [index.d.ts](https://gist.github.com/exuanbo/79d6fcd2c617f03ec530106bfe46d7a4).

## Todo

- [ ] Full unit test
- [ ] Document

## Credits

[standard/standard-engine](https://github.com/standard/standard-engine)

## License

[MIT License](https://github.com/exuanbo/standard-engine-ts/blob/main/LICENSE) © 2020 [Exuanbo](https://github.com/exuanbo)
