const path = require('path')
const fs = require('fs')

let setupCompleted = false

/**
 * !! DO NOT USE. DOES NOT WORK !!
 * Jest globalSetup shim for TypeScript with path aliases.
 * - Registers ts-node to transpile TS at runtime
 * - Registers tsconfig-paths using tests/tsconfig.json so aliases like 'metis/*' work
 */
module.exports = async (...args) => {
  let [, projectConfig] = args
  let projectName = projectConfig.displayName.name
  let stage = setupCompleted ? 'teardown' : 'setup'
  let subDir = projectName.split(':').join('/')
  let tsConfigPath = path.resolve(__dirname, subDir, 'tsconfig.json')
  let setupPathTs = path.resolve(__dirname, subDir, `${stage}.ts`)
  let raw = fs.readFileSync(tsConfigPath, 'utf8')
  let tsconfig = JSON.parse(raw)
  let { baseUrl, paths } = tsconfig.compilerOptions
  let baseUrlResolved = path.resolve(__dirname, subDir, baseUrl)

  console.log(`\n\nRunning ${stage} for project: ${projectName}\n\n`)

  // Register ts-node and tsconfig-paths packages
  // to properly handle the TS script that will
  // be run.
  require('ts-node').register({
    transpileOnly: true,
    project: tsConfigPath,
  })
  require('tsconfig-paths').register({
    baseUrl: baseUrlResolved,
    paths,
  })

  // Import and run script.
  let script = require(setupPathTs)
  if (typeof script !== 'function') {
    script = script.default
  }
  await script(...args)

  setupCompleted = true
}
