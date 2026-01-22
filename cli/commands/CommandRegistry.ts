import type { Command } from './Command'

/**
 * A list of recognized commands used in the METIS CLI.
 */
export class CommandRegistry {
  /**
   * The list of registered commands.
   */
  private commands: Command[]

  public constructor() {
    this.commands = []
  }

  /**
   * Registers a new command in the registry.
   * @param command The command to register.
   * @returns itself for chaining.
   */
  public register(command: Command): CommandRegistry {
    this.commands.push(command)
    return this
  }

  /**
   * Retrieves a command by its name.
   * @param name The name or short name of the command.
   * @returns The command if found, otherwise undefined.
   */
  public get(name: string): Command | undefined {
    return this.commands.find(
      (command) => command.name === name || command.shortName === name,
    )
  }

  /**
   * Retrieves all registered commands.
   * @returns An array of registered commands.
   */
  public getAll(): Command[] {
    return [...this.commands]
  }

  /**
   * Formats all available commands as a string to be outputted to
   * the console.
   * @param options Modifies the behavior of the log output.
   */
  public formatAvailableCommands(options: TLogAvailableOptions = {}): string {
    let { prefix = '' } = options

    // Update prefix with trailing space if
    // a prefix was provided.
    if (prefix && !/\s$/.test(prefix)) {
      prefix += ' '
    }

    return (
      `${prefix}Below is a list of available commands:\n\n` +
      this.getAll()
        .map((cmd) => `  - ${cmd.name}: ${cmd.description}`)
        .join('\n') +
      '\n'
    )
  }
}

/* -- TYPES -- */

/**
 * Modifies the behavior of {@link CommandRegistry.formatAvailableCommands} method.
 */
export interface TLogAvailableOptions {
  /**
   * Places the provided text at the start of the output.
   */
  prefix?: string
}
