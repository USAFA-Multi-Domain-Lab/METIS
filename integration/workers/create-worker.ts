import { TargetEnvWorker } from 'TargetEnvWorker'
import path from 'node:path'
import { workerData } from 'node:worker_threads'
import * as tsconfigPaths from 'tsconfig-paths'

const tsconfigPath = path.resolve(__dirname, '../target-env/tsconfig.json')
const tsconfig = require(tsconfigPath)
const baseUrlResolved = path.resolve(
  path.dirname(tsconfigPath),
  tsconfig.compilerOptions.baseUrl,
)
const restoreTsConfig = tsconfigPaths.register({
  baseUrl: baseUrlResolved,
  paths: {
    ...tsconfig.compilerOptions.paths,
  },
})

require('../target-env/globals.ts')

new TargetEnvWorker(workerData).execute()
