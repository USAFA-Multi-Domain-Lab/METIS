#!/usr/bin/env node

/**
 * CJS Loader for TypeScript CLI
 * This loader uses tsx to execute the TypeScript CLI without compilation.
 */

const { spawn } = require('child_process')
const path = require('path')

// Execute the TypeScript file using tsx with the tsconfig
const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx')
const entryPath = path.join(__dirname, '@metis.ts')
const tsConfigPath = path.join(__dirname, 'tsconfig.json')

let child = spawn(
  tsxPath,
  ['--tsconfig', tsConfigPath, entryPath, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
  },
)

child.on('exit', (code) => {
  process.exit(code || 0)
})
