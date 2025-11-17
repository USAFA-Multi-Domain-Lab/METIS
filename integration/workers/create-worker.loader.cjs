const tsNode = require('ts-node')
const path = require('path')
const tsconfigPaths = require('tsconfig-paths')

const tsconfigPath = path.resolve(__dirname, './tsconfig.json')
const tsconfig = require(tsconfigPath)
const baseUrlResolved = path.resolve(
  path.dirname(tsconfigPath),
  tsconfig.compilerOptions.baseUrl,
)

tsNode.register({
  transpileOnly: true,
  project: tsconfigPath,
})

const restoreTsConfig = tsconfigPaths.register({
  baseUrl: baseUrlResolved,
  paths: {
    ...tsconfig.compilerOptions.paths,
  },
})

require('./create-worker.ts')

restoreTsConfig()
