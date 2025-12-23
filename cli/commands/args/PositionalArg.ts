import { CommandArg } from './CommandArg'

/**
 * An argument that is identified by its position
 * in the command-line input.
 * @note The name of the argument will follow "\<this-example-format\>",
 * with hyphen separating lowercase words and surrounding brackets.
 * Name will be derived from the accessor. For example, an accessor
 * of "targetEnvId" will produce a name of "\<target-env-id\>".
 */
export class PositionalArg<
  TAccessor extends string,
> extends CommandArg<TAccessor> {
  public constructor(accessor: TAccessor, description: string) {
    super(accessor, description)
  }

  // Implemented
  public get name(): string {
    let result = '<'

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

    result += '>'

    return result
  }
}
