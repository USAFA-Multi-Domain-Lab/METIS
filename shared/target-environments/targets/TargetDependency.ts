import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'

export const AVAILABLE_DEPENDENCIES_RAW = [
  {
    name: 'truthy',
    condition: (value: any) => !!value,
  } as const,
  {
    name: 'falsey',
    condition: (value: any) => !value,
  } as const,
  {
    name: 'regex',
    condition: (value: any, expected: TDependencyArg[]) => {
      if (typeof value !== 'string') return false
      let regex = expected[0]
      if (!(regex instanceof RegExp)) return false
      return regex.test(value)
    },
  } as const,
  {
    name: 'equals',
    condition: (value: any, expected: TDependencyArg[]) =>
      expected[0] === value,
  } as const,
  {
    name: 'equals-some',
    condition: (value: any, expected: TDependencyArg[]) =>
      expected.some((x) => x === value),
  } as const,
  {
    name: 'not-equals',
    condition: (value: any, unexpected: TDependencyArg[]) =>
      unexpected[0] !== value,
  } as const,
  {
    name: 'not-empty',
    condition: (value: any) =>
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'string' && value.trim().length > 0),
  },
] as const

/**
 * Represents a dependency between target parameters — controls whether
 * a parameter is displayed based on another parameter's argument value.
 */
export class TargetDependency implements TDependency {
  // Inherited
  public readonly dependentId: TDependency['dependentId']

  // Inherited
  public readonly name: TDependency['name']

  /**
   * The condition function.
   * @param value The value to check.
   * @returns Whether the value meets the condition.
   */
  private _condition: TDependency['condition']
  /**
   * @inheritdoc `TDependency["condition"]`
   */
  public condition = (value: any) => this._condition(value, this.args)

  /**
   * The arguments for the condition.
   */
  private args: TDependencyArg[]

  /**
   * Creates a new dependency.
   * @param name The name of the dependency.
   * @param dependentId The ID of the parameter whose argument value this dependency evaluates.
   * @param condition The condition function.
   * @param args The arguments for the condition.
   */
  public constructor(
    name: TDependencyName,
    dependentId: string,
    condition: TDependencyCondition,
    args: TDependencyArg[],
  ) {
    // If the name includes '/', throw an error.
    if (name.includes('/')) {
      throw new Error("Name cannot include '/'")
    }
    // If the dependent ID includes '/', throw an error.
    if (dependentId.includes('/')) {
      throw new Error("Dependent ID cannot include '/'")
    }

    this.dependentId = dependentId
    this.name = name
    this._condition = condition
    this.args = args
  }

  /**
   * Checks if the argument value for the parameter identified by `dependentId` is truthy
   * (e.g. 1, 'a', true, etc.).
   * @param dependentId The ID of the parameter to evaluate.
   * @returns A new dependency that checks if the argument value is truthy.
   * @example TargetDependency.TRUTHY('dependentId')
   */
  public static TRUTHY = (dependentId: string) =>
    TargetDependency.SELECT('truthy', dependentId)

  /**
   * Checks if the argument value for the parameter identified by `dependentId` is falsey
   * (e.g. null, undefined, 0, false, '', etc.).
   * @param dependentId The ID of the parameter to evaluate.
   * @returns A new dependency that checks if the argument value is falsey.
   * @example TargetDependency.FALSEY('dependentId')
   */
  public static FALSEY = (dependentId: string) =>
    TargetDependency.SELECT('falsey', dependentId)

  /**
   * Checks if the argument value for the parameter identified by `dependentId` matches the provided regular expression.
   * @param dependentId The ID of the parameter to evaluate.
   * @param regex The regular expression to match the argument value against.
   * @returns A new dependency that checks if the argument value matches the provided regular expression.
   * @example TargetDependency.REGEX('dependentId', /^[a-z]+$/)
   */
  public static REGEX = (dependentId: string, regex: RegExp) =>
    TargetDependency.SELECT('regex', dependentId, regex)

  /**
   * Ensures the argument value for the parameter identified by `dependentId` matches the expected value.
   * @param dependentId The ID of the parameter to evaluate.
   * @param expected The expected value.
   * @returns A new dependency that ensures the argument value matches the expected value.
   * @example TargetDependency.EQUALS('fruit', 'apple')
   */
  public static EQUALS = (dependentId: string, expected: TDependencyArg) =>
    TargetDependency.SELECT('equals', dependentId, expected)

  /**
   * Ensures the argument value for the parameter identified by `dependentId` matches at least one of the expected values.
   * @param dependentId The ID of the parameter to evaluate.
   * @param expected The expected values.
   * @returns A new dependency that ensures the argument value matches at least one of the expected values.
   * @example TargetDependency.EQUALS_SOME('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static EQUALS_SOME = (
    dependentId: string,
    expected: TDependencyArg[],
  ) => TargetDependency.SELECT('equals-some', dependentId, expected)

  /**
   * Ensures the argument value for the parameter identified by `dependentId` does not match the unexpected value.
   * @param dependentId The ID of the parameter to evaluate.
   * @param unexpected The unexpected value.
   * @returns A new dependency that ensures the argument value does not match the unexpected value.
   * @example TargetDependency.NOT_EQUALS('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static NOT_EQUALS = (
    dependentId: string,
    unexpected: TDependencyArg,
  ) => TargetDependency.SELECT('not-equals', dependentId, unexpected)

  /**
   * Checks if the argument value for the parameter identified by `dependentId` is
   * an array with at least one element or a string with at least one non-whitespace
   * character.
   * @param dependentId The ID of the parameter to evaluate.
   * @returns A new dependency that checks if the argument value is non-empty.
   * @example TargetDependency.NOT_EMPTY('dependentId')
   */
  public static NOT_EMPTY = (dependentId: string) =>
    TargetDependency.SELECT('not-empty', dependentId)

  /**
   * Encodes the dependency.
   * @returns The encoded dependency.
   */
  public encode = () =>
    `${this.name}/${this.dependentId}/${JSON.stringify(
      this.args,
      (_key, value) => TargetDependency.JSON_REPLACER(value),
    )}`

  /**
   * Decodes the dependency.
   * @param encoding The encoded dependency.
   * @returns The decoded dependency.
   */
  public static DECODE(encoding: string): TargetDependency {
    try {
      // Split the encoding.
      let name = encoding.split('/')[0] as TDependencyName
      let dependentId: string = encoding.split('/')[1]
      let args: TDependencyArg[] = JSON.parse(
        encoding.replace(`${name}/${dependentId}/`, ''),
        (_key, value) => TargetDependency.JSON_REVIVER(value),
      )
      let condition = TargetDependency.GET_CONDITION(name)
      return new TargetDependency(name, dependentId, condition, args)
    } catch (error) {
      console.error('Failed to decode dependency:', error)
      throw error
    }
  }

  /**
   * Gets the dependency by name.
   * @param name The name of the dependency.
   * @returns The dependency.
   */
  private static GET(name: TDependencyName): TDependencyBase | undefined {
    return AVAILABLE_DEPENDENCIES_RAW.find(
      (dependency) => dependency.name === name,
    )
  }

  /**
   * Gets the condition function for a dependency by name.
   * @param name The name of the dependency.
   * @returns The condition function.
   */
  private static GET_CONDITION(name: TDependencyName) {
    let dependency = TargetDependency.GET(name)
    if (!dependency) throw new Error(`Dependency "${name}" not found`)
    return dependency.condition
  }

  /**
   * Selects a dependency.
   * @param name The name of the dependency.
   * @param dependentId The ID of the parameter to evaluate.
   * @param args The arguments for the condition.
   * @returns The encoded dependency.
   */
  private static SELECT(
    name: TDependencyName,
    dependentId: string,
    args: TDependencyArg | TDependencyArg[] = [],
  ) {
    // Extract dependency details.
    let { condition } = TargetDependency.GET(name)!
    // If the args are not an array, convert them to an array.
    args = ArrayToolbox.toArray(args)
    // Create the dependency.
    let dependency = new TargetDependency(name, dependentId, condition, args)
    // Return the encoded dependency.
    return dependency.encode()
  }

  /**
   * JSON replacer for serializing dependencies, including `RegExp` values.
   * @param value The value being serialized.
   * @returns The serialized value.
   */
  private static JSON_REPLACER = (value: unknown) => {
    if (value instanceof RegExp) {
      return {
        type: 'regex',
        source: value.source,
        flags: value.flags,
      }
    }

    return value
  }

  /**
   * JSON reviver for deserializing dependencies, including `RegExp` values.
   * @param value The value being deserialized.
   * @returns The deserialized value.
   */
  private static JSON_REVIVER = (value: any) => {
    if (
      value &&
      typeof value === 'object' &&
      value.type === 'regex' &&
      typeof value.source === 'string'
    ) {
      return new RegExp(value.source, value.flags ?? undefined)
    }

    return value
  }
}

/* -- TYPES -- */

/**
 * A value passed as an input to a dependency's condition function
 * (e.g. the expected value in `EQUALS`, or a `RegExp` in `REGEX`).
 */
export type TDependencyArg = string | number | boolean | RegExp

/**
 * Type for a valid name for a dependency.
 */
export type TDependencyName =
  (typeof AVAILABLE_DEPENDENCIES_RAW)[number]['name']

/**
 * Type for a valid condition function for a dependency.
 */
export type TDependencyCondition =
  | ((value: any) => boolean)
  | ((value: any, args: TDependencyArg[]) => boolean)

/**
 * Base type for a dependency.
 */
export type TDependencyBase = {
  /**
   * The name of the dependency condition function.
   */
  name: TDependencyName
  /**
   * The condition function.
   * @param value The value to check.
   * @returns Whether the value meets the condition.
   */
  condition: TDependencyCondition
}

/**
 * Represents a dependency between target parameters — controls whether
 * a parameter is displayed based on another parameter's argument value.
 */
export type TDependency = TDependencyBase & {
  /**
   * The ID of the parameter whose argument value this dependency evaluates.
   */
  dependentId: string
  /**
   * Encodes the dependency.
   * @returns The encoded dependency.
   */
  encode: () => string
}
