import type { CommandArg } from './args/CommandArg'
import { FlagArg } from './args/FlagArg'
import { PositionalArg } from './args/PositionalArg'
import type { TCommandOptions } from './Command'
import { Command } from './Command'

/**
 * Standard implementation of a CLI command.
 */
export class StandardCommand<
  const TArgs extends CommandArg<string>[],
> extends Command {
  /**
   * The arguments used by the command that are positional arguments.
   */
  public get positionalArgs() {
    return this.args.filter((arg) => {
      return arg instanceof PositionalArg
    })
  }

  /**
   * The arguments used by the command that are flag arguments.
   */
  public get flagArgs() {
    return this.args.filter((arg) => {
      return arg instanceof FlagArg
    })
  }

  /**
   * Builds the options section of the help output.
   * @see {@link help}
   */
  private get optionsHelp(): string {
    let output = `\nOptions:\n`

    for (let flagArg of this.flagArgs) {
      let flagLine = '  '

      // Add short name if available
      if (flagArg.shortName) {
        flagLine += `${flagArg.shortName}, `
      }

      // Add full flag name
      flagLine += flagArg.name

      // Add subargs if any
      if (flagArg.subargs.length > 0) {
        flagLine +=
          ' ' +
          flagArg.subargs
            .map((subarg: PositionalArg<any>) => subarg.name)
            .join(' ')
      }

      // Pad to align descriptions (using 30 chars as alignment point)
      let padding = Math.max(1, 30 - flagLine.length)
      flagLine += ' '.repeat(padding) + flagArg.description

      output += flagLine + '\n'
    }

    return output
  }

  /**
   * Generates a help message for the command in a Docker-like format.
   */
  public get help(): string {
    let usage = `Usage:  metis ${this.name}`

    // Add positional args to usage
    if (this.positionalArgs.length > 0) {
      usage += ' ' + this.positionalArgs.map((arg) => arg.name).join(' ')
    }

    // Add [OPTIONS] if there are flag args
    if (this.flagArgs.length > 0) {
      usage += ' [OPTIONS]'
    }

    let output = `${usage}\n\n${this.description}\n`

    // Add aliases section if command has a short name
    if (this.shortName) {
      output += `\nAliases:\n  metis ${this.shortName}, metis ${this.name}\n`
    }

    // Add options section if there are flag args
    if (this.flagArgs.length > 0) {
      output += this.optionsHelp
    }

    return output
  }

  public constructor(
    // Implemented
    name: string,
    // Implemented
    description: string,
    /**
     * The arguments that the command accepts.
     */
    public readonly args: TArgs,
    /**
     * The function that will be executed when
     * the command is invoked.
     */
    private readonly _execute: (args: MapArgs<TArgs>) => Promise<void>,
    // Implemented
    options: TCommandOptions = {},
  ) {
    super(name, description, options)
  }

  /**
   * Gets the corresponding {@link FlagArg} for the
   * raw string argument passed in {@link process.argv}.
   * @param rawArg The raw string argument from the CLI.
   */
  private getFlagArg(rawArg: string) {
    return this.args.find(
      (arg) =>
        [arg.name, arg.shortName].includes(rawArg) && arg instanceof FlagArg,
    ) as FlagArg<string, PositionalArg<string>[]> | undefined
  }

  // Implemented
  public async execute(
    options: TStandardCommandExecutionOptions = {},
  ): Promise<void> {
    const { processArgvOffset = 3 } = options

    let argMap: Record<string, string | Record<string, string>> = {}
    let rawArgs = process.argv.slice(processArgvOffset)
    let positionalArgs = this.positionalArgs
    let argOverflowCount = 0

    if (rawArgs.includes('--help')) {
      console.log(this.help)
      return
    }

    for (let i = 0; i < rawArgs.length; i++) {
      let cursor = rawArgs[i]

      // If the cursor is a flag argument,
      // then get the corresponding FlagArg
      // instance and get its subargs.
      if (cursor.startsWith('-')) {
        let arg = this.getFlagArg(cursor)
        let subargMap: Record<string, string> = {}

        if (!arg) {
          throw new Error(
            `Unrecognized flag argument '${cursor}' for command '${this.name}'.\n`,
          )
        } else if (!(arg instanceof FlagArg)) {
          throw new Error(
            `Argument '${cursor}' is not a flag argument for command '${this.name}'. This error should never occur. Please contact support.\n`,
          )
        }

        // Loop through subargs and collect their values.
        for (let j = 0; j < arg.subargs.length; j++) {
          let subarg = arg.subargs[j]

          // Move to next raw arg for subarg value.
          i++
          cursor = rawArgs[i]

          // Handle missing subarg value.
          if (!cursor) {
            let missingSubargCount = arg.subargs.length - j
            throw new Error(
              `${arg.name} flag is missing ${missingSubargCount} required sub-argument(s).\n` +
                `Usage: metis ${this.name} ${positionalArgs
                  .map((a) => a.name)
                  .join(' ')} ${arg.name} ${arg.subargs
                  .map((a: PositionalArg<string>) => a.name)
                  .join(' ')}`,
            )
          }

          // Capture subarg value.
          subargMap[subarg.accessor] = cursor
        }

        // Assign subarg map in arg map.
        argMap[arg.accessor] = subargMap
      } else {
        let arg = positionalArgs.shift()

        // If no positional arg is available,
        // increment overflow count and continue.
        // Later an error will be thrown to show
        // the exact number of excess arguments
        // that were provided.
        if (!arg) {
          argOverflowCount++
          continue
        }

        // Assign positional arg value in arg map.
        argMap[arg.accessor] = cursor
      }
    }

    if (argOverflowCount > 0) {
      throw new Error(
        `${this.name} command expects ${
          this.positionalArgs.length
        } positional argument(s) but received ${
          this.positionalArgs.length + argOverflowCount
        }.\n` +
          `Usage: metis ${this.name} ${this.positionalArgs
            .map((a) => a.name)
            .join(' ')}`,
      )
    } else if (positionalArgs.length > 0) {
      let missingArgCount = positionalArgs.length

      throw new Error(
        `${this.name} command is missing ${missingArgCount} required argument(s).\n` +
          `Usage: metis ${this.name} ${this.positionalArgs
            .map((a) => a.name)
            .join(' ')}`,
      )
    }

    return this._execute(argMap as MapArgs<TArgs>)
  }
}

/* -- TYPES -- */

/**
 * Maps subargs array to an object type.
 */
type MapSubargs<TSubargs extends readonly PositionalArg<string>[]> = {
  [K in TSubargs[number] as K['accessor']]: string
}

/**
 * Converts an array of CommandArg types to an object type
 * where keys are the arg accessors and values depend on arg type.
 */
type MapArgs<TArgs extends readonly CommandArg<string>[]> = {
  [K in TArgs[number] as K['accessor']]: K extends FlagArg<any, infer TSubargs>
    ? MapSubargs<TSubargs> | undefined
    : string
}

/**
 * Customizes the behavior of the {@link StandardCommand.execute} method.
 */
export interface TStandardCommandExecutionOptions {
  /**
   * Offset to apply when slicing {@link process.argv} for
   * command arguments. A larger offset will skip more arguments.
   * @default 3 (Skips node, script, command name)
   */
  processArgvOffset?: number
}
