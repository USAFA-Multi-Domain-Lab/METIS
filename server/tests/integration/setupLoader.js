// tests/integration/setupLoader.js
const path = require('path')
const tsNode = require('ts-node')
const tsConfigPaths = require('tsconfig-paths')

// absolute path to the server tsconfig
const tsconfigPath = path.resolve(__dirname, '../../tsconfig.json')

// let ts-node transpile only our code
tsNode.register({
  transpileOnly: true,
  project: tsconfigPath,
  compilerOptions: { module: 'NodeNext', moduleResolution: 'NodeNext' },
  ignore: [
    // do NOT touch anything in node_modules
    /node_modules/,
  ],
})

// resolve "extends" and path aliases
const loaded = tsConfigPaths.loadConfig(tsconfigPath)
if (loaded.resultType === 'failed') {
  console.error('❌  Failed to load tsconfig:', loaded.message)
  process.exit(1)
}
tsConfigPaths.register({
  baseUrl: loaded.absoluteBaseUrl,
  paths: loaded.paths,
})

// finally require your real TS setup file
module.exports = require('./setup.ts').default
