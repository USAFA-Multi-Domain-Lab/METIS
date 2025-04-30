import MissionAction from '../missions/actions'
import { MissionForce } from '../missions/forces'
import MissionNode from '../missions/nodes'

const AVAILABLE_DEPENDENCIES_RAW = [
  {
    name: 'truthy',
    condition: (value: any) => !!value,
  } as const,
  {
    name: 'falsey',
    condition: (value: any) => !value,
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
    name: 'equals-every',
    condition: (value: any, expected: TDependencyArg[]) =>
      expected.every((x) => x === value),
  } as const,
  {
    name: 'not-equals',
    condition: (value: any, unexpected: TDependencyArg[]) =>
      unexpected[0] !== value,
  } as const,
  {
    name: 'not-equals-some',
    condition: (value: any, unexpected: TDependencyArg[]) =>
      unexpected.some((x) => x !== value),
  } as const,
  {
    name: 'not-equals-every',
    condition: (value: any, unexpected: TDependencyArg[]) =>
      unexpected.every((x) => x !== value),
  } as const,
  {
    name: 'force',
    condition: (value: any) => value instanceof MissionForce,
  } as const,
  {
    name: 'node',
    condition: (value: any) =>
      value.force instanceof MissionForce && value.node instanceof MissionNode,
  } as const,
  {
    name: 'action',
    condition: (value: any) =>
      value.force instanceof MissionForce &&
      value.node instanceof MissionNode &&
      (value.action instanceof MissionAction || value.action === undefined),
  } as const,
] as const

/**
 * Represents a dependency that can be found within a target's arguments.
 */
export default class Dependency implements TDependency {
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
   * @param dependentId The ID of the dependent argument.
   * @param condition The condition function.
   * @param args The arguments for the condition.
   */
  public constructor(
    name: TDependencyName,
    dependentId: string,
    condition: TDependencyCondition,
    args: TDependencyArg[] = [],
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
   * Checks if the value of the argument (*referenced by the argument's ID*) is truthy
   * (e.g. 1, 'a', true, etc.).
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is truthy.
   * @example Dependency.TRUTHY('dependentId')
   */
  public static TRUTHY = (dependentId: string) =>
    Dependency.SELECT('truthy', dependentId)

  /**
   * Checks if the value of the argument (*referenced by the argument's ID*) is falsey
   * (e.g. null, undefined, 0, false, '', etc.).
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is falsey.
   * @example Dependency.FALSEY('dependentId')
   */
  public static FALSEY = (dependentId: string) =>
    Dependency.SELECT('falsey', dependentId)

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value matches the expected value.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected value.
   * @returns A new dependency that ensures the argument's value matches the expected value.
   * @example Dependency.EQUALS('fruit', 'apple')
   */
  public static EQUALS = (dependentId: string, expected: TDependencyArg) =>
    Dependency.SELECT('equals', dependentId, expected)

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value(s) match at least one of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that ensures the argument's value(s) match at least one of the expected values.
   * @example Dependency.EQUALS_SOME('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static EQUALS_SOME = (
    dependentId: string,
    expected: TDependencyArg[],
  ) => Dependency.SELECT('equals-some', dependentId, expected)

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value(s) match all of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that ensures the argument's value(s) match all of the expected values.
   * @example Dependency.EQUALS_EVERY('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static EQUALS_EVERY = (
    dependentId: string,
    expected: TDependencyArg[],
  ) => Dependency.SELECT('equals-every', dependentId, expected)

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value doesn't match the unexpected value.
   * @param dependentId The ID of the dependent argument.
   * @param unexpected The unexpected value.
   * @returns A new dependency that ensures the argument's value doesn't match the unexpected value.
   * @example Dependency.NOT_EQUALS('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static NOT_EQUALS = (
    dependentId: string,
    unexpected: TDependencyArg,
  ) => Dependency.SELECT('not-equals', dependentId, unexpected)

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value(s) don't match at least one of the unexpected values.
   * @param dependentId The ID of the dependent argument.
   * @param unexpected The unexpected values.
   * @returns A new dependency that ensures the argument's value(s) don't match at least one of the unexpected values.
   * @example Dependency.NOT_EQUALS_SOME('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static NOT_EQUALS_SOME = (
    dependentId: string,
    unexpected: TDependencyArg[],
  ) => Dependency.SELECT('not-equals-some', dependentId, unexpected)

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value(s) don't match all of the unexpected values.
   * @param dependentId The ID of the dependent argument.
   * @param unexpected The unexpected values.
   * @returns A new dependency that ensures the argument's value(s) don't match all of the unexpected values.
   * @example Dependency.NOT_EQUALS_EVERY('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static NOT_EQUALS_EVERY = (
    dependentId: string,
    unexpected: TDependencyArg[],
  ) => Dependency.SELECT('not-equals-every', dependentId, unexpected)

  /**
   * Checks if the argument's (*referenced by the argument's ID*) value is a force object.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value is a force object.
   * @example Dependency.FORCE('dependentId')
   */
  public static FORCE = (dependentId: string) =>
    Dependency.SELECT('force', dependentId)

  /**
   * Checks if the argument's (*referenced by the argument's ID*) value contains a force object and a node object.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value contains a force object and a node object.
   * @example Dependency.NODE('dependentId')
   */
  public static NODE = (dependentId: string) =>
    Dependency.SELECT('node', dependentId)

  /**
   * Checks if the argument's (*referenced by the argument's ID*) value contains a force object, a node object, and an action object.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value contains a force object, a node object, and an action object.
   * @example Dependency.ACTION('dependentId')
   */
  public static ACTION = (dependentId: string) =>
    Dependency.SELECT('action', dependentId)

  /**
   * Encodes the dependency.
   * @returns The encoded dependency.
   */
  public encode = () =>
    `${this.name}/${this.dependentId}/${JSON.stringify(this.args)}`

  /**
   * Decodes the dependency.
   * @param encoding The encoded dependency.
   * @returns The decoded dependency.
   */
  public static DECODE(encoding: string): Dependency {
    try {
      // Split the encoding.
      let name = encoding.split('/')[0] as TDependencyName
      let dependentId: string = encoding.split('/')[1]
      let args: TDependencyArg[] = JSON.parse(
        encoding.replace(`${name}/${dependentId}/`, ''),
      )
      let condition = Dependency.GET_CONDITION(name)
      return new Dependency(name, dependentId, condition, args)
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
    let dependency = Dependency.GET(name)
    if (!dependency) throw new Error(`Dependency "${name}" not found`)
    return dependency.condition
  }

  /**
   * Selects a dependency.
   * @param name The name of the dependency.
   * @param dependentId The ID of the dependent argument.
   * @param args The arguments for the condition.
   * @returns The encoded dependency.
   */
  private static SELECT(
    name: TDependencyName,
    dependentId: string,
    args: TDependencyArg | TDependencyArg[] = [],
  ) {
    // Extract dependency details.
    const { condition } = Dependency.GET(name)!
    // If the args are not an array, convert them to an array.
    if (!Array.isArray(args)) args = [args]
    // Create the dependency.
    const dependency = new Dependency(name, dependentId, condition, args)
    // Return the encoded dependency.
    return dependency.encode()
  }
}

/* ------------------------------ DEPENDENCY TYPES ------------------------------ */

/**
 * A dependency's argument.
 */
type TDependencyArg = string | number | boolean

/**
 * Type for a valid name for a dependency.
 */
type TDependencyName = (typeof AVAILABLE_DEPENDENCIES_RAW)[number]['name']

/**
 * Type for a valid condition function for a dependency.
 */
type TDependencyCondition =
  | ((value: any) => boolean)
  | ((value: any, args: TDependencyArg[]) => boolean)

/**
 * Base type for a dependency.
 */
type TDependencyBase = {
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
 * Represents a dependency that can be found within a target's arguments.
 */
type TDependency = TDependencyBase & {
  /**
   * The ID of the dependent argument.
   */
  dependentId: string
  /**
   * Encodes the dependency.
   * @returns The encoded dependency.
   */
  encode: () => string
}
