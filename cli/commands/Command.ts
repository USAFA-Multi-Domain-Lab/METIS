import type { CommandArg } from './args/CommandArg'
import { FlagArg } from './args/FlagArg'
import { PositionalArg } from './args/PositionalArg'

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
 * Represents a command that can be executed from the CLI.
 */
export class Command<const TArgs extends CommandArg<string>[]> {
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

  public constructor(
    /**
     * The name of the command. This will be the
     * keyword used to invoke the command from
     * the CLI.
     */
    public readonly name: string,
    /**
     * Describes the purpose and behavior of the command.
     */
    public readonly description: string,
    /**
     * The arguments that the command accepts.
     */
    public readonly args: TArgs,
    /**
     * The function that will be executed when
     * the command is invoked.
     */
    private readonly _execute: (args: MapArgs<TArgs>) => Promise<void>,
  ) {}

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

  /**
   * Executes the command with the arguments found
   * in the CLI process.
   */
  public async execute(): Promise<void> {
    let argMap: Record<string, string | Record<string, string>> = {}
    let rawArgs = process.argv.slice(3) // Skip first 2 args (node, script, command)
    let positionalArgs = this.positionalArgs
    let argOverflowCount = 0

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
