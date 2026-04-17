import type { TCommandOptions } from './Command'
import { Command } from './Command'
import type { StandardCommand } from './StandardCommand'

/**
 * Standard implementation of a CLI command.
 */
export class CommandGroup extends Command {
  public constructor(
    // Implemented
    name: string,
    // Implemented
    description: string,
    /**
     * Subcommands that belong to this command group.
     */
    public readonly subcommands: StandardCommand<any>[],
    // Implemented
    options: TCommandOptions = {},
  ) {
    super(name, description, options)
  }

  // Implemented
  public async execute(): Promise<void> {
    let subcommandSelection = process.argv[3]

    for (let subcommand of this.subcommands) {
      // If this is the selected subcommand, execute it
      // with the appropriate argument offset.
      if (subcommand.name === subcommandSelection) {
        await subcommand.execute({ processArgvOffset: 4 })
        return
      }
    }

    throw new Error(
      `Unrecognized subcommand '${subcommandSelection}' for command '${this.name}'.`,
    )
  }
}
