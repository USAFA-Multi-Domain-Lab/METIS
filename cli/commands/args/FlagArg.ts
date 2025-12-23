import { CommandArg } from './CommandArg'
import type { PositionalArg } from './PositionalArg'

/**
 * An argument that is identified by a flag in the
 * command-line input.
 * @note The name of the argument will follow "--this-example-format",
 * with hyphen separating lowercase words and prefixed with a double dash.
 * Name will be derived from the accessor. For example, an accessor
 * of "author" will produce a name of "--author".
 */
export class FlagArg<
  TAccessor extends string,
  const TSubargs extends PositionalArg<string>[],
> extends CommandArg<TAccessor> {
  /**
   * @param accessor @see {@link CommandArg.accessor}
   * @param description @see {@link CommandArg.description}
   * @param subargs @see {@link FlagArg.subargs}
   * @param options Customizes the behavior of the flag argument.
   */
  public constructor(
    accessor: TAccessor,
    description: string,
    /**
     * Sub-arguments that further define the behavior of the flag.
     * @example
     * ```bash
     * metis install <target-env-id> --author <author-name>
     * ```
     * In this example, `--author` is a flag argument with a sub-argument
     * `<author-name>` that provides additional information for the flag.
     */
    public readonly subargs: TSubargs,
    /**
     * Customizes the behavior of a FlagArg.
     */
    public readonly options: TFlagArgOptions = {},
  ) {
    super(accessor, description)
  }

  // Implemented
  public get name(): string {
    let result = '--'

    for (let i = 0; i < this.accessor.length; i++) {
      let char = this.accessor[i]
      let prevChar = i > 0 ? this.accessor[i - 1] : ''

      // If the character is uppercase, and the previous
      // character was not also uppercase, include a hyphen.
      if (char === char.toUpperCase() && prevChar !== prevChar.toUpperCase()) {
        result += '-'
      }

      // Add the character to the result in lowercase form.
      result += char.toLowerCase()
    }

    // Clear trailing hyphens, if any.
    result = result.replace(/-*$/, '')

    return result
  }

  /**
   * The short name of the flag, if shortening is enabled.
   * @example
   * ```bash
   * metis install <target-env-id> --author <author-name>
   * metis install <target-env-id> -a <author-name>
   * ```
   * In this example, `-a` is the short form of the `--author` flag.
   */
  public get shortName(): string | undefined {
    if (this.options.shorten) {
      return `-${this.accessor[0].toLowerCase()}`
    }
    return undefined
  }
}

/* -- TYPES -- */

/**
 * Options that customize the behavior of a FlagArg.
 */
export interface TFlagArgOptions {
  /**
   * Allows flag to be shortened to a single dash and
   * character. This will use the first character of the
   * accessor as the short form.
   * @example
   * ```bash
   * metis install <target-env-id> --author <author-name>
   * metis install <target-env-id> -a <author-name>
   * ```
   * In this example, `-a` is the short form of the `--author` flag.
   */
  shorten?: boolean
}
