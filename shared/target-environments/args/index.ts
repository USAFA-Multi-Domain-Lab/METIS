import Dependency from '../dependencies'
import BooleanArg, { TBooleanArg, TBooleanArgJson } from './boolean-arg'
import DropdownArg, { TDropdownArg, TDropdownArgJson } from './dropdown-arg'
import LargeStringArg, {
  TLargeStringArg,
  TLargeStringArgJson,
} from './large-string-arg'
import MissionComponentArg, {
  TMissionComponentArg,
  TMissionComponentArgJson,
} from './mission-component'
import NumberArg, { TNumberArg, TNumberArgJson } from './number-arg'
import StringArg, { TStringArg, TStringArgJson } from './string-arg'

/**
 * Represents the base argument type for a target.
 */
export default class Arg {
  /**
   * Decodes all dependencies.
   * @param dependencies The dependencies to decode.
   * @returns The decoded dependencies.
   */
  public static decodeDependencies = (dependencies: string[]): Dependency[] => {
    return dependencies.map((dependency: string) => {
      return Dependency.DECODE(dependency)
    })
  }

  /**
   * Encodes the argument dependencies.
   * @param dependencies The dependencies to encode.
   * @returns The encoded dependencies.
   */
  public static encodeDependencies = (dependencies: Dependency[]): string[] => {
    return dependencies.map((dependency: Dependency) => {
      return dependency.encode()
    })
  }

  /**
   * Converts arguments to JSON.
   * @param args The arguments to convert.
   * @returns The arguments as JSON.
   */
  public static toJson = (args: TTargetArg[]): TTargetArgJson[] => {
    return args.map((arg: TTargetArg) => {
      switch (arg.type) {
        case 'number':
          return NumberArg.toJson(arg)
        case 'string':
          return StringArg.toJson(arg)
        case 'large-string':
          return LargeStringArg.toJson(arg)
        case 'dropdown':
          return DropdownArg.toJson(arg)
        case 'boolean':
          return BooleanArg.toJson(arg)
        case 'force':
        case 'node':
        case 'action':
          return MissionComponentArg.toJson(arg)
      }
    })
  }

  /**
   * Converts arguments from JSON.
   * @param args The arguments as JSON to convert.
   * @returns The arguments.
   */
  public static fromJson = (args: TTargetArgJson[]): TTargetArg[] => {
    return args.map((arg: TTargetArgJson) => {
      switch (arg.type) {
        case 'number':
          return NumberArg.fromJson(arg)
        case 'string':
          return StringArg.fromJson(arg)
        case 'large-string':
          return LargeStringArg.fromJson(arg)
        case 'dropdown':
          return DropdownArg.fromJson(arg)
        case 'boolean':
          return BooleanArg.fromJson(arg)
        case 'force':
        case 'node':
        case 'action':
          return MissionComponentArg.fromJson(arg)
      }
    })
  }
}

/* ------------------------------ TARGET ARGUMENT TYPES ------------------------------ */

/**
 * The base argument type for a target.
 */
export type TBaseArg = {
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * The grouping ID of the argument.
   * @note This is used to group arguments together in the target-effect interface.
   * @default undefined
   */
  groupingId?: string
  /**
   * These are the keys of the arguments that the current argument depends on.
   * @note If the argument depends on another argument, the argument will only be displayed if the dependency is met.
   * @note If the argument depends on multiple arguments, all dependencies must be met for the argument to be displayed.
   * @note If the argument has no dependencies (i.e. set to `undefined` or `[]`), the argument will always be displayed.
   * @default undefined
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is truthy (i.e. 1, 'a', true, etc.)
   * // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.TRUTHY('argument1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.SOME('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: Dependency[]
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the argument.
   * @default undefined
   */
  tooltipDescription?: string
}

/**
 * The arguments used for the target-effect interface and the target-effect API.
 */
export type TTargetArg =
  | TNumberArg
  | TStringArg
  | TLargeStringArg
  | TDropdownArg
  | TBooleanArg
  | TMissionComponentArg

/**
 * The JSON representation of the base argument type for a target.
 */
export type TBaseArgJson = {
  /**
   * The ID of the argument.
   */
  _id: string
  /**
   * The argument's name. This is displayed to the user.
   */
  name: string
  /**
   * The grouping ID of the argument.
   * @note This is used to group arguments together in the target-effect interface.
   * @default undefined
   */
  groupingId?: string
  /**
   * These are the keys of the arguments that the current argument depends on.
   * @note If the argument depends on another argument, the argument will only be displayed if the dependency is met.
   * @note If the argument depends on multiple arguments, all dependencies must be met for the argument to be displayed.
   * @note If the argument has no dependencies (i.e. set to `undefined` or `[]`), the argument will always be displayed.
   * @default undefined
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is truthy (i.e. 1, 'a', true, etc.)
   * // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.TRUTHY('argument1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This argument is always displayed because it has no dependencies.
   * {
   *    _id: 'argument1',
   *    name: 'Argument 1',
   *    required: true,
   *    groupingId: 'argument',
   *    type: 'number',
   *    default: 0,
   * },
   * // This argument is only displayed if the value of 'argument1' is equal to 1, 2, or 3.
   * {
   *    _id: 'argument2',
   *    name: 'Argument 2',
   *    required: false,
   *    groupingId: 'argument',
   *    type: 'number',
   *    dependencies: [Dependency.SOME('argument1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: string[]
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the argument.
   * @default undefined
   */
  tooltipDescription?: string
}

/**
 * The arguments used for the target-effect interface and the target-effect API.
 */
export type TTargetArgJson =
  | TNumberArgJson
  | TStringArgJson
  | TLargeStringArgJson
  | TDropdownArgJson
  | TBooleanArgJson
  | TMissionComponentArgJson
