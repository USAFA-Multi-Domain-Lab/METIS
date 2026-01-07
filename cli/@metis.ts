import { command_config } from 'commands/@config'
import { command_install } from 'commands/@install'
import { command_restart } from 'commands/@restart'
import { command_start } from 'commands/@start'
import { command_status } from 'commands/@status'
import { command_stop } from 'commands/@stop'
import { command_uninstall } from 'commands/@uninstall'
import { CommandRegistry } from 'commands/CommandRegistry'
import { ICONS } from './util/assets'

/**
 * Registry of available METIS CLI commands.
 */
const commandRegistry = new CommandRegistry()
  .register(command_status)
  .register(command_start)
  .register(command_stop)
  .register(command_restart)
  .register(command_install)
  .register(command_uninstall)
  .register(command_config)

/**
 * Main command dispatcher.
 * @param args Command line arguments
 */
async function executeMetis(args: string[]): Promise<void> {
  // Verify that a command name was provided.
  let commandName = args[0]
  if (!commandName) {
    throw new Error(
      commandRegistry.formatAvailableCommands({
        prefix: 'No command provided.',
      }),
    )
  }

  // If the command name is '--help', output the help message.
  if (commandName === '--help') {
    console.log(commandRegistry.formatAvailableCommands())
    return
  }

  // Verify that the command exists for the provided name.
  let command = commandRegistry.get(commandName)
  if (!command) {
    throw new Error(
      commandRegistry.formatAvailableCommands({
        prefix: `Unrecognized command '${commandName}'.`,
      }),
    )
  }

  await command.execute()
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
    await executeMetis(args.slice(2))
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
