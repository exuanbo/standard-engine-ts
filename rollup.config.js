import esbuild from 'rollup-plugin-esbuild-transform'
import dts from 'rollup-plugin-dts'
import pkg from './package.json'

export default [
  {
    external: ['fs', 'os', 'path', ...Object.keys(pkg.dependencies)],
    input: 'src/index.ts',
    plugins: [
      esbuild([
        {
          loader: 'json'
        },
        {
          loader: 'ts',
          target: 'es2019'
        }
      ])
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
