#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { execSync } = require('child_process')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

// Emoji icons
const icons = {
  error: '❌',
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
  file: '📄',
  lock: '🔒',
  pencil: '📝',
  steps: '📝',
}

/**
 * Prompts user for input with a yes/no question.
 * @param {string} question - The question to ask.
 * @param {boolean} defaultToYes - Whether the default answer is yes.
 * @returns {Promise<boolean>} - True if user answered yes, false otherwise.
 */
function promptYesNo(question, defaultToYes = false) {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    let suffix = defaultToYes ? '(Y/n)' : '(y/N)'
    rl.question(`${question} ${suffix}: `, (answer) => {
      rl.close()
      let normalized = answer.trim().toLowerCase()
      if (normalized === '') {
        resolve(defaultToYes)
      } else {
        resolve(normalized === 'y' || normalized === 'yes')
      }
    })
  })
}

/**
 * Generates a configs.json file for a target environment.
 * @param {string} targetEnvPath - Path to the target environment
 */
async function config_generate(targetEnvPath) {
  // Validate target environment path
  if (!targetEnvPath) {
    console.log(`${icons.error} Error: Target environment path required.`)
    console.log('Usage: ./cli.sh config generate <path-to-target-env>')
    console.log(
      'Example: ./cli.sh config generate integration/target-env/my-env',
    )
    process.exit(1)
  }

  if (!fs.existsSync(targetEnvPath)) {
    console.log(
      `${icons.error} Error: Target environment directory not found: ${targetEnvPath}`,
    )
    process.exit(1)
  }

  let configFile = path.join(targetEnvPath, 'configs.json')

  // Check if configs.json already exists
  if (fs.existsSync(configFile)) {
    let overwrite = await promptYesNo(
      `${icons.warning}  configs.json already exists at ${configFile}. Overwrite?`,
      false,
    )
    if (!overwrite) {
      console.log(`${icons.error} Operation cancelled.`)
      process.exit(0)
    }
  }

  // Create initial configs.json with example structure
  console.log(`${icons.pencil} Creating configs.json at ${configFile}`)
  let configContent = [
    {
      _id: '',
      name: '',
      data: {},
    },
  ]
  fs.writeFileSync(
    configFile,
    JSON.stringify(configContent, null, 2) + '\n',
    'utf8',
  )

  // Set permissions (read/write for owner only) - Unix only
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(configFile, 0o600)
      console.log(`${icons.success} Set file permissions to 600 (rw-------)`)
    } catch (err) {
      console.log(
        `${icons.warning} Could not set file permissions: ${err.message}`,
      )
    }
  }

  // Prompt for .gitignore
  let addToGitignore = await promptYesNo(
    `${icons.lock} Add configs.json to .gitignore? This is recommended for sensitive data`,
    true,
  )

  if (addToGitignore) {
    let gitignoreFile = path.join(targetEnvPath, '.gitignore')

    // Create .gitignore if it doesn't exist
    if (!fs.existsSync(gitignoreFile)) {
      fs.writeFileSync(gitignoreFile, 'configs.json\n', 'utf8')
      console.log(`${icons.success} Created .gitignore and added configs.json`)
    } else {
      // Check if configs.json is already in .gitignore
      let gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8')
      let lines = gitignoreContent.split('\n')
      if (lines.includes('configs.json')) {
        console.log(`${icons.info}  configs.json already in .gitignore`)
      } else {
        fs.appendFileSync(gitignoreFile, 'configs.json\n', 'utf8')
        console.log(`${icons.success} Added configs.json to .gitignore`)
      }
    }
  } else {
    console.log(
      `${icons.warning}  Skipped .gitignore update. Remember to handle sensitive data appropriately.`,
    )
  }

  console.log('')
  console.log(`${icons.success} Configuration file created successfully!`)
  console.log(`${icons.file} Location: ${configFile}`)
  console.log(`${icons.steps} Next steps:`)
  console.log(`   1. Edit ${configFile} with your actual configuration data`)
  console.log(`   2. Ensure the file is readable by the METIS server process`)
  console.log(`   3. Restart the server to load the new configuration`)
}

/**
 * Executes systemctl commands for metis.service (Unix only).
 * @param {string} action - The systemctl action (start|stop|restart|status)
 */
function metisSystemctl(action) {
  if (process.platform === 'win32') {
    console.log(
      `${icons.error} Error: systemctl commands are not supported on Windows.`,
    )
    process.exit(1)
  }

  try {
    execSync(`sudo systemctl ${action} metis.service`, { stdio: 'inherit' })
  } catch (err) {
    console.log(`${icons.error} Error: Failed to execute systemctl ${action}`)
    process.exit(1)
  }
}

/**
 * Main command dispatcher.
 * @param {string[]} args - Command line arguments
 */
async function metisCmd(args) {
  if (args.length === 0) {
    console.log(`${icons.error} Error: No command specified.`)
    console.log('Usage: ./cli.sh {start|stop|restart|status|config generate}')
    process.exit(1)
  }

  let command = args[0]

  switch (command) {
    case 'start':
    case 'stop':
    case 'restart':
    case 'status':
      metisSystemctl(command)
      break

    case 'config':
      if (args.length < 2) {
        console.log(
          `${icons.error} Error: config command requires a subcommand.`,
        )
        console.log('Usage: ./cli.sh config generate <path-to-target-env>')
        process.exit(1)
      }
      if (args[1] === 'generate' || args[1] === 'gen') {
        await config_generate(args[2])
      } else {
        console.log(
          `${icons.error} Error: Unrecognized config command '${args[1]}'.`,
        )
        console.log('Usage: ./cli.sh config generate <path-to-target-env>')
        process.exit(1)
      }
      break

    default:
      console.log(`${icons.error} Error: Unrecognized command '${command}'.`)
      console.log('Usage: ./cli.sh {start|stop|restart|status|config generate}')
      process.exit(1)
  }
}

// Main execution
;(async () => {
  console.log(' ')
  try {
    await metisCmd(process.argv.slice(2))
  } catch (err) {
    console.log(`${icons.error} Unexpected error: ${err.message}`)
    process.exit(1)
  }
  console.log(' ')
})()
