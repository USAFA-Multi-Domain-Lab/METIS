/**
 * An argument for a CLI command.
 */
export abstract class CommandArg<TAccessor extends string> {
  public constructor(
    /**
     * The key used to access the argument's value from the
     * object passed to the {@link Command.execute} method.
     */
    public accessor: TAccessor,
    /**
     * Describes the purpose and behavior of the argument.
     */
    public description: string,
  ) {
    if (!CommandArg.accessorRegex.test(accessor)) {
      throw new Error(
        `Invalid accessor: ${accessor}\n` +
          'Accessors must be in camelCase with alphabetic characters only (Must match regex: "/^[a-z][a-zA-Z]*$/" ).',
      )
    }
  }

  /**
   * The name of the argument as it appears in the CLI.
   * @note This will typically be built from the accessor.
   */
  public abstract get name(): string

  /**
   * A shortened name for the command arg.
   * @note Override this in the subclass to provide
   * a custom short name.
   */
  public get shortName(): string | undefined {
    return undefined
  }

  /**
   * Confirms that the accessor is a valid JavaScript
   * variable name.
   */
  public static accessorRegex = /^[a-z][a-zA-Z]*$/
}
