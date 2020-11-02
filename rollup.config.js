const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')
const pkg = require('./package.json')

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ],
  plugins: [typescript(), nodeResolve(), commonjs()],
  // Bundle devDependencies "find-up", "get-stdin", "xdg-basedir"
  external: ['fs', 'os', 'path', 'util', ...Object.keys(pkg.dependencies)]
}
