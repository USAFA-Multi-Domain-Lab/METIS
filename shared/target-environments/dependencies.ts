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
  private _condition: (value: any, args: DependencyArg[]) => boolean
  public condition = (value: any) => this._condition(value, this.args)

  /**
   * The arguments for the condition.
   */
  private args: DependencyArg[]

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
    condition: (value: any, args: DependencyArg[]) => boolean,
    args: DependencyArg[] = [],
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
   * Creates a new dependency that checks if the value is truthy
   * (e.g. 1, 'a', true, etc.).
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is truthy.
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
   * Creates a new dependency that checks if the value is falsey
   * (e.g. null, undefined, 0, false, '', etc.).
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is falsey.
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
   * Creates a new dependency that checks if the value is equal to any of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that checks if the value is equal to any of the expected values.
   */
  public static EQUALS = (dependentId: string, expected: DependencyArg[]) => {
    // Create the dependency.
    let dependency = new Dependency(
      'EQUALS',
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
   * @returns A new dependency that checks if the value is equal to any of the expected values.
   */
  private static EQUALS_DECODED = (
    dependentId: string,
    expected: DependencyArg[],
  ) =>
    new Dependency(
      'EQUALS',
      dependentId,
      (value, expected) => expected.some((x) => x === value),
      expected,
    )

  /**
   * Creates a new dependency that checks if the value is not equal to any of the expected values.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that checks if the value is not equal to any of the expected values.
   */
  public static NOT_EQUALS = (
    dependentId: string,
    expected: DependencyArg[],
  ) => {
    // Create the dependency.
    let dependency = new Dependency(
      'NOT_EQUALS',
      dependentId,
      (value, expected) => expected.every((x) => x !== value),
      expected,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @param expected The expected values.
   * @returns A new dependency that checks if the value is not equal to any of the expected values.
   */
  private static NOT_EQUALS_DECODED = (
    dependentId: string,
    expected: DependencyArg[],
  ) =>
    new Dependency(
      'NOT_EQUALS',
      dependentId,
      (value, expected) => expected.every((x) => x !== value),
      expected,
    )

  /**
   * Creates a new dependency that checks if the value is a valid force.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is a valid force.
   */
  public static VALIDATE_FORCE = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency(
      'VALIDATE_FORCE',
      dependentId,
      (value) => !!value,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is a valid force.
   */
  private static VALIDATE_FORCE_DECODED = (dependentId: string) =>
    new Dependency('VALIDATE_FORCE', dependentId, (value) => !!value)

  /**
   * Creates a new dependency that checks if the value is a valid node.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is a valid node.
   */
  public static VALIDATE_NODE = (dependentId: string) => {
    // Create the dependency.
    let dependency = new Dependency(
      'VALIDATE_NODE',
      dependentId,
      (value) => !!value,
    )
    // Return the encoded dependency.
    return dependency.encode()
  }
  /**
   * Decodes the dependency.
   * @param dependentId The ID of the dependent argument.
   * @returns A new dependency that checks if the value is a valid node.
   */
  private static VALIDATE_NODE_DECODED = (dependentId: string) =>
    new Dependency('VALIDATE_NODE', dependentId, (value) => !!value)

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
      let args: DependencyArg[] = JSON.parse(
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
type DependencyArg = string | number | boolean

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
