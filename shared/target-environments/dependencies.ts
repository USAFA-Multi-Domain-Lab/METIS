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
  private _condition: (
    value: any,
    args: TDependencyArg[],
  ) => TDependencyConditionResult
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
    condition: (
      value: any,
      args: TDependencyArg[],
    ) => TDependencyConditionResult,
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
    let dependency = new Dependency('TRUTHY', dependentId, (value) =>
      !!value ? 'valid' : 'invalid',
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is truthy.
   */
  private static TRUTHY_DECODED = (dependentId: string) =>
    new Dependency('TRUTHY', dependentId, (value) =>
      !!value ? 'valid' : 'invalid',
    )

  /**
   * Checks if the value of the argument (*referenced by the argument's ID*) is falsey
   * (e.g. null, undefined, 0, false, '', etc.).
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is falsey.
   * @example Dependency.FALSEY('dependentId')
   */
  public static FALSEY = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency('FALSEY', dependentId, (value) =>
      !value ? 'valid' : 'invalid',
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is falsey.
   */
  private static FALSEY_DECODED = (dependentId: string) =>
    new Dependency('FALSEY', dependentId, (value) =>
      !value ? 'valid' : 'invalid',
    )

  /**
   * Checks if the value of the argument (*referenced by the argument's ID*) is equal to at least one of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that checks if the value of the argument is equal to at least one of the expected values.
   * @example Dependency.EQUALS('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static EQUALS = (dependentId: string, expected: TDependencyArg[]) => {
    // Create the dependency.
    let dependency = new Dependency(
      'EQUALS',
      dependentId,
      (value, expected) =>
        expected.some((x) => x === value) ? 'valid' : 'invalid',
      expected,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that checks if the value of the argument is equal to at least one of the expected values.
   */
  private static EQUALS_DECODED = (
    dependentId: string,
    expected: TDependencyArg[],
  ) =>
    new Dependency(
      'EQUALS',
      dependentId,
      (value, expected) =>
        expected.some((x) => x === value) ? 'valid' : 'invalid',
      expected,
    )

  /**
   * Checks if the value of the argument (*referenced by the argument's ID*) is not equal to any of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that checks if the value of the argument is not equal to any of the expected values.
   * @example Dependency.NOT_EQUALS('fruit', ['apple', 'grape', 'banana', 'orange'])
   */
  public static NOT_EQUALS = (
    dependentId: string,
    expected: TDependencyArg[],
  ) => {
    // Create the dependency.
    let dependency = new Dependency(
      'NOT_EQUALS',
      dependentId,
      (value, expected) =>
        expected.every((x) => x !== value) ? 'valid' : 'invalid',
      expected,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that checks if the value of the argument is not equal to any of the expected values.
   */
  private static NOT_EQUALS_DECODED = (
    dependentId: string,
    expected: TDependencyArg[],
  ) =>
    new Dependency(
      'NOT_EQUALS',
      dependentId,
      (value, expected) =>
        expected.every((x) => x !== value) ? 'valid' : 'invalid',
      expected,
    )

  /**
   * Checks if the argument's (*referenced by the argument's ID*) value is a valid force.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value is a valid force.
   * @example Dependency.VALIDATE_FORCE('dependentId')
   */
  public static VALIDATE_FORCE = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency('VALIDATE_FORCE', dependentId, (value) =>
      value instanceof MissionForce ? 'valid' : 'warning',
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value is a valid force.
   */
  private static VALIDATE_FORCE_DECODED = (dependentId: string) =>
    new Dependency('VALIDATE_FORCE', dependentId, (value) =>
      value instanceof MissionForce ? 'valid' : 'warning',
    )

  /**
   * Checks if the argument's (*referenced by the argument's ID*) value contains a valid force and node.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value contains a valid force and node.
   * @example Dependency.VALIDATE_NODE('dependentId')
   */
  public static VALIDATE_NODE = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency('VALIDATE_NODE', dependentId, (value) =>
      value.force instanceof MissionForce && value.node instanceof MissionNode
        ? 'valid'
        : 'warning',
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the argument's value contains a valid force and node.
   */
  private static VALIDATE_NODE_DECODED = (dependentId: string) =>
    new Dependency('VALIDATE_NODE', dependentId, (value) =>
      value.force instanceof MissionForce && value.node instanceof MissionNode
        ? 'valid'
        : 'warning',
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
        case 'EQUALS':
          return Dependency.EQUALS_DECODED(dependentId, args)
        case 'NOT_EQUALS':
          return Dependency.NOT_EQUALS_DECODED(dependentId, args)
        case 'VALIDATE_FORCE':
          return Dependency.VALIDATE_FORCE_DECODED(dependentId)
        case 'VALIDATE_NODE':
          return Dependency.VALIDATE_NODE_DECODED(dependentId)
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
 * The result of a dependency condition.
 */
export type TDependencyConditionResult = 'valid' | 'invalid' | 'warning'

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
   * @returns Whether the value is valid, invalid, or a warning.
   * @note A warning is a condition that is not met, but is not
   * critical to applying effects to their targets.
   */
  condition: (value: any) => TDependencyConditionResult
  /**
   * Encodes the dependency.
   * @returns The encoded dependency.
   */
  encode: () => string
}
