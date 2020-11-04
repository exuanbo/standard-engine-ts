import builtins from 'builtin-modules'
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import cleanup from 'rollup-plugin-cleanup'
import dts from 'rollup-plugin-dts'
import pkg from './package.json'

export default [
  {
    external: [...builtins, ...Object.keys(pkg.dependencies)],
    input: 'src/index.ts',
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
      json({ compact: true }),
      cleanup()
    ],
    output: [
      {
        file: pkg.main,
        format: 'cjs'
      },
      {
        file: pkg.module,
        format: 'es'
      }
    ]
  },
  {
    input: '.cache/src/index.d.ts',
    output: {
      file: pkg.types,
      format: 'es'
    },
    plugins: [dts()]
  }
]
