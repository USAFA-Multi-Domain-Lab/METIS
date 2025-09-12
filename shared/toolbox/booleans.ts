/**
 * A toolbox for working with boolean values.
 */
export default class BooleanToolbox {
  /**
   * String values that are considered true.
   */
  public static readonly trueBooleanValuesAsStrings = [
    '1',
    'true',
    'True',
    'TRUE',
    't',
    'T',
    'yes',
    'Yes',
    'YES',
    'y',
    'Y',
  ]

  /**
   * String values that are considered false.
   */
  public static readonly falseBooleanValuesAsStrings = [
    '0',
    'false',
    'False',
    'FALSE',
    'f',
    'F',
    'no',
    'No',
    'NO',
    'n',
    'N',
  ]

  /**
   * All valid string representations of boolean values.
   */
  public static readonly validBooleanValuesAsStrings =
    this.trueBooleanValuesAsStrings.concat(this.falseBooleanValuesAsStrings)

  /**
   * Convert a string representation of a boolean to an actual boolean.
   * @param value The string to convert.
   * @returns The boolean value.
   * @throws Will throw an error if the string is not a valid boolean representation.
   */
  public static parse(value: string): boolean {
    if (this.trueBooleanValuesAsStrings.includes(value)) {
      return true
    } else if (this.falseBooleanValuesAsStrings.includes(value)) {
      return false
    } else {
      throw new Error(`Invalid boolean string: ${value}`)
    }
  }

  /**
   * Check if a value is a valid boolean or a valid string representation of a boolean.
   * @param value The value to check.
   * @returns True if the value is valid, false otherwise.
   */
  public static isValid(value: string | boolean): boolean {
    if (typeof value === 'boolean') {
      return true
    } else if (
      typeof value === 'string' &&
      this.validBooleanValuesAsStrings.includes(value)
    ) {
      return true
    } else {
      return false
    }
  }
}
