#!/usr/bin/env node

/**
 * CJS Loader for TypeScript CLI
 * This loader uses tsx to execute the TypeScript CLI without compilation.
 */

const { spawn } = require('child_process')
const path = require('path')

// Execute the TypeScript file using tsx with the tsconfig
const tsxBin = process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', tsxBin)
const entryPath = path.join(__dirname, '@metis.ts')
const tsConfigPath = path.join(__dirname, 'tsconfig.json')

let child = spawn(
  tsxPath,
  ['--tsconfig', tsConfigPath, entryPath, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  },
)

child.on('exit', (code) => {
  process.exit(code || 0)
})
