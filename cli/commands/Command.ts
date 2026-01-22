/**
 * Represents a command that can be executed from the CLI.
 */
export abstract class Command {
  /**
   * The short name of the command, if shortening is enabled.
   * @example
   * ```bash
   * metis install <target-env-id>
   * metis i <target-env-id>
   * ```
   * In this example, `i` is the short form of the `install` command.
   */
  public get shortName(): string | undefined {
    if (this.options.shorten) {
      return `${this.name[0].toLowerCase()}`
    }
    return undefined
  }

  /**
   * Generates a help message for the command in a Docker-like format.
   */
  public get help(): string {
    let usage = `Usage:  metis ${this.name}`

    let output = `${usage}\n\n${this.description}\n`

    if (this.shortName) {
      output += `\nAliases:\n  metis ${this.shortName}, metis ${this.name}\n`
    }

    return output
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
     * Customizes the behavior of a command.
     */
    public readonly options: TCommandOptions = {},
  ) {
    if (!Command.nameRegex.test(name)) {
      throw new Error(
        `Invalid command name: ${name}\n` +
          'Command names must be in kebab-case with all lowercase alphabetic characters and dashes only (Must match regex: "/^[a-z]+(-[a-z]+)*$/" ).',
      )
    }
  }

  /**
   * Executes the command with the arguments found
   * in the CLI process.
   */
  public abstract execute(): Promise<void>

  /**
   * Regex used to validate command names (kebab case
   * all lowercase with no leading or trailing dashes).
   */
  public static nameRegex = /^[a-z]+(-[a-z]+)*$/
}

/**
 * Customizes the behavior of a command.
 */
export interface TCommandOptions {
  /**
   * Allows command name to be shortened to one character.
   * @example
   * ```bash
   * metis install <target-env-id>
   * metis i <target-env-id>
   * ```
   * In this example, `i` is the short form of the `install` command.
   */
  shorten?: boolean
}
