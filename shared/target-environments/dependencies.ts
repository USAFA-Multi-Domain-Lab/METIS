import { MissionForce } from '../missions/forces'
import MissionNode from '../missions/nodes'

/**
 * Represents a dependency that can be found within a target's arguments.
 */
export default class Dependency implements TCommonDependency {
  // Inherited
  public readonly dependentId: TCommonDependency['dependentId']

  // Inherited
  public readonly name: TCommonDependency['name']

  /**
   * The condition function.
   * @param value The value to check.
   * @param args The arguments for the condition.
   * @returns Whether the value meets the condition.
   */
  private _condition: (value: any, args: TDependencyArg[]) => boolean
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
    name: string,
    dependentId: string,
    condition: (value: any, args: TDependencyArg[]) => boolean,
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
  public static TRUTHY = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency('TRUTHY', dependentId, (value) => !!value)
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is truthy.
   */
  private static TRUTHY_DECODED = (dependentId: string) =>
    new Dependency('TRUTHY', dependentId, (value) => !!value)

  /**
   * Checks if the value of the argument (*referenced by the argument's ID*) is falsey
   * (e.g. null, undefined, 0, false, '', etc.).
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is falsey.
   * @example Dependency.FALSEY('dependentId')
   */
  public static FALSEY = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency('FALSEY', dependentId, (value) => !value)
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is falsey.
   */
  private static FALSEY_DECODED = (dependentId: string) =>
    new Dependency('FALSEY', dependentId, (value) => !value)

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value(s) match at least one of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that ensures the argument's values match at least one of the expected values.
   * @example Dependency.SOME('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static SOME = (dependentId: string, expected: TDependencyArg[]) => {
    // Create the dependency.
    let dependency = new Dependency(
      'SOME',
      dependentId,
      (value, expected) => expected.some((x) => x === value),
      expected,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that ensures the argument's values match at least one of the expected values.
   */
  private static SOME_DECODED = (
    dependentId: string,
    expected: TDependencyArg[],
  ) =>
    new Dependency(
      'SOME',
      dependentId,
      (value, expected) => expected.some((x) => x === value),
      expected,
    )

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value(s) match all of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that ensures the argument's values match all of the expected values.
   * @example Dependency.EVERY('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static EVERY = (dependentId: string, expected: TDependencyArg[]) => {
    // Create the dependency.
    let dependency = new Dependency(
      'EVERY',
      dependentId,
      (value, expected) => expected.every((x) => x === value),
      expected,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that ensures the argument's values match all of the expected values.
   */
  private static EVERY_DECODED = (
    dependentId: string,
    expected: TDependencyArg[],
  ) =>
    new Dependency(
      'EVERY',
      dependentId,
      (value, expected) => expected.every((x) => x === value),
      expected,
    )

  /**
   * Ensures the argument's (*referenced by the argument's ID*) value(s) don't match any of the unexpected values.
   * @param dependentId The ID of the dependent argument.
   * @param unexpected The unexpected values.
   * @returns A new dependency that ensures the argument's value(s) don't match any of the unexpected values.
   * @example Dependency.NONE('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static NONE = (dependentId: string, unexpected: TDependencyArg[]) => {
    // Create the dependency.
    let dependency = new Dependency(
      'NONE',
      dependentId,
      (value, unexpected) => unexpected.every((x) => x !== value),
      unexpected,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @param unexpected The expected values.
   * @returns A new dependency that ensures the argument's value(s) don't match any of the unexpected values.
   */
  private static NONE_DECODED = (
    dependentId: string,
    unexpected: TDependencyArg[],
  ) =>
    new Dependency(
      'NONE',
      dependentId,
      (value, unexpected) => unexpected.every((x) => x !== value),
      unexpected,
    )

  /**
   * Checks if the argument's (*referenced by the argument's ID*) value is a force object.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value is a force object.
   * @example Dependency.FORCE('dependentId')
   */
  public static FORCE = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency(
      'FORCE',
      dependentId,
      (value) => value instanceof MissionForce,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value is a force object.
   */
  private static FORCE_DECODED = (dependentId: string) =>
    new Dependency(
      'FORCE',
      dependentId,
      (value) => value instanceof MissionForce,
    )

  /**
   * Checks if the argument's (*referenced by the argument's ID*) value contains a force object and a node object.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value contains a force object and a node object.
   * @example Dependency.NODE('dependentId')
   */
  public static NODE = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency(
      'NODE',
      dependentId,
      (value) =>
        value.force instanceof MissionForce &&
        value.node instanceof MissionNode,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value contains a force object and a node object.
   */
  private static NODE_DECODED = (dependentId: string) =>
    new Dependency(
      'NODE',
      dependentId,
      (value) =>
        value.force instanceof MissionForce &&
        value.node instanceof MissionNode,
    )

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
  public static decode(encoding: string): Dependency {
    try {
      // Split the encoding.
      let name: string = encoding.split('/')[0]
      let dependentId: string = encoding.split('/')[1]
      let args: TDependencyArg[] = JSON.parse(
        encoding.replace(`${name}/${dependentId}/`, ''),
      )

      switch (name) {
        case 'TRUTHY':
          return Dependency.TRUTHY_DECODED(dependentId)
        case 'FALSEY':
          return Dependency.FALSEY_DECODED(dependentId)
        case 'SOME':
          return Dependency.SOME_DECODED(dependentId, args)
        case 'EVERY':
          return Dependency.EVERY_DECODED(dependentId, args)
        case 'NONE':
          return Dependency.NONE_DECODED(dependentId, args)
        case 'FORCE':
          return Dependency.FORCE_DECODED(dependentId)
        case 'NODE':
          return Dependency.NODE_DECODED(dependentId)
        default:
          throw new Error(`Unexpected name for Dependency Condition: ${name}`)
      }
    } catch (error) {
      console.error('Failed to decode DependencyCondition.')
      throw error
    }
  }
}

/* ------------------------------ DEPENDENCY TYPES ------------------------------ */

/**
 * A dependency's argument.
 */
type TDependencyArg = string | number | boolean

/**
 * Represents a dependency that can be found within a target's arguments.
 */
export interface TCommonDependency {
  /**
   * The name of the dependency condition function.
   */
  name: string
  /**
   * The ID of the dependent argument.
   */
  dependentId: string
  /**
   * The condition function.
   * @param value The value to check.
   * @returns Whether the value meets the condition.
   */
  condition: (value: any) => boolean
  /**
   * Encodes the dependency.
   * @returns The encoded dependency.
   */
  encode: () => string
}
