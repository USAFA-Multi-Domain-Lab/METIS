import { execSync } from 'child_process'
import { install } from 'commands/@install'
import { uninstall } from 'commands/@uninstall'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { ICONS } from './util/assets'

/**
 * Prompts user for input with a yes/no question.
 * @param question - The question to ask.
 * @param defaultToYes - Whether the default answer is yes.
 * @returns True if user answered yes, false otherwise.
 */
function promptYesNo(
  question: string,
  defaultToYes: boolean = false,
): Promise<boolean> {
  let readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    let suffix = defaultToYes ? '(Y/n)' : '(y/N)'
    readlineInterface.question(`${question} ${suffix}: `, (answer) => {
      readlineInterface.close()
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
 * @param targetEnvPath - Path to the target environment
 */
async function config_generate(targetEnvPath: string): Promise<void> {
  // Validate target environment path
  if (!targetEnvPath) {
    throw new Error(
      'Target environment path required.\n' +
        'Usage: metis config generate <path-to-target-env>\n' +
        'Example: metis config generate integration/target-env/my-env',
    )
  }

  if (!fs.existsSync(targetEnvPath)) {
    throw new Error(`Target environment directory not found: ${targetEnvPath}`)
  }

  let configFile = path.join(targetEnvPath, 'configs.json')

  // Check if configs.json already exists
  if (fs.existsSync(configFile)) {
    let overwrite = await promptYesNo(
      `${ICONS.warning}  configs.json already exists at ${configFile}. Overwrite?`,
      false,
    )
    if (!overwrite) {
      console.log(`${ICONS.info} Operation cancelled.`)
      return
    }
  }

  // Create initial configs.json with example structure
  console.log(`${ICONS.pencil} Creating configs.json at ${configFile}`)
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
      console.log(`${ICONS.success} Set file permissions to 600 (rw-------)`)
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : String(err)
      console.log(
        `${ICONS.warning} Could not set file permissions: ${errorMessage}`,
      )
    }
  }

  // Prompt for .gitignore
  let addToGitignore = await promptYesNo(
    `${ICONS.lock} Add configs.json to .gitignore? This is recommended for sensitive data`,
    true,
  )

  if (addToGitignore) {
    let gitignoreFile = path.join(targetEnvPath, '.gitignore')

    // Create .gitignore if it doesn't exist
    if (!fs.existsSync(gitignoreFile)) {
      fs.writeFileSync(gitignoreFile, 'configs.json\n', 'utf8')
      console.log(`${ICONS.success} Created .gitignore and added configs.json`)
    } else {
      // Check if configs.json is already in .gitignore
      let gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8')
      let lines = gitignoreContent.split('\n')
      if (lines.includes('configs.json')) {
        console.log(`${ICONS.info}  configs.json already in .gitignore`)
      } else {
        fs.appendFileSync(gitignoreFile, 'configs.json\n', 'utf8')
        console.log(`${ICONS.success} Added configs.json to .gitignore`)
      }
    }
  } else {
    console.log(
      `${ICONS.warning}  Skipped .gitignore update. Remember to handle sensitive data appropriately.`,
    )
  }

  console.log('')
  console.log(`${ICONS.success} Configuration file created successfully!`)
  console.log(`${ICONS.file} Location: ${configFile}`)
  console.log(`${ICONS.steps} Next steps:`)
  console.log(`   1. Edit ${configFile} with your actual configuration data`)
  console.log(`   2. Ensure the file is readable by the METIS server process`)
  console.log(`   3. Restart the server to load the new configuration`)
}

/**
 * Executes commands to manage METIS as a system service in
 * an OS-specific manner.
 * @param command - The desired command to send to the service
 * manager (start|stop|restart|status)
 */
function manageMetisService(command: TServiceCommand): void {
  const windowsCommandMap = {
    start: 'Start-Service',
    stop: 'Stop-Service',
    restart: 'Restart-Service',
    status: 'Get-Service',
  }

  try {
    let commandLineCode = ''

    // Windows
    if (process.platform === 'win32') {
      commandLineCode = `powershell -NoProfile -Command "${windowsCommandMap[command]} METIS"`
    }
    // Unix
    else {
      commandLineCode = `sudo systemctl ${command} metis.service`
      console.log(
        'Executing command with sudo privileges. You may be prompted for your system password.',
      )
    }

    execSync(commandLineCode, { stdio: 'inherit' })
  } catch (err) {
    throw new Error(`Failed to execute service command "${command}".`)
  }
}

/**
 * Main command dispatcher.
 * @param args - Command line arguments
 */
async function metisCmd(args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error(
      'No command specified.\n' +
        'Usage: metis {start|stop|restart|status|config|install|uninstall}',
    )
  }

  let command = args[0]

  switch (command) {
    case 'start':
    case 'stop':
    case 'restart':
    case 'status':
      manageMetisService(command)
      break

    case 'config':
      const subcommands = ['generate', 'gen']

      // Detect errors.
      if (args.length < 2) {
        throw new Error(
          'config command requires a subcommand.\n' +
            'Usage: metis config generate <path-to-target-env>',
        )
      }
      if (!subcommands.includes(args[1])) {
        throw new Error(
          `Unrecognized config command '${args[1]}'.\n` +
            'Usage: metis config generate <path-to-target-env>',
        )
      }

      await config_generate(args[2])
      break

    case 'install':
    case 'i':
      await install.execute()
      break

    case 'uninstall':
    case 'u':
      // Detect errors.
      if (args.length < 2) {
        throw new Error(
          'uninstall command requires an argument.\n' +
            'Usage: metis uninstall <target-env-id>',
        )
      }
      await uninstall(args[1])
      break

    default:
      throw new Error(
        `Unrecognized command '${command}'.\n` +
          'Usage: metis {start|stop|restart|status|config|install|uninstall}',
      )
  }
}

/**
 * Main entry point for the CLI.
 * @param args Command line arguments.
 */
async function main(...args: string[]): Promise<void> {
  console.log(' ')

  // Attempt running the requested command
  // with the provided arguments.
  try {
    await metisCmd(args.slice(2))
  } catch (err) {
    let errorMessage = err instanceof Error ? err.message : String(err)
    console.log(`${ICONS.error} ${errorMessage}`)
  } finally {
    console.log(' ')
    process.exit(1)
  }
}

// Execute main function.
main(...process.argv)

/* -- TYPES -- */

/**
 * Defines a valid command for managing METIS as a service.
 */
type TServiceCommand = 'start' | 'stop' | 'restart' | 'status'
