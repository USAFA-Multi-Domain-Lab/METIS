import type { TargetDependency } from './targets/TargetDependency'

/**
 * The possible metadata schema for a node target-argument
 * that is present in an effect's arguments.
 */
export type TNodeMetadata = Partial<{
  /**
   * A force's local key.
   */
  forceKey: string
  /**
   * A force's name.
   */
  forceName: string
  /**
   * A node's local key.
   */
  nodeKey: string
  /**
   * A node's name.
   */
  nodeName: string
}>

/**
 * The possible metadata schema for a force target-argument
 * that is present in an effect's arguments.
 */
export type TForceMetadata = Partial<{
  /**
   * A force's local key.
   */
  forceKey: string
  /**
   * A force's name.
   */
  forceName: string
}>

/**
 * The possible metadata schema for a file target-argument
 * that is present in an effect's arguments.
 */
export type TFileMetadata = Partial<{
  /**
   * A file's ID.
   */
  fileId: string
  /**
   * A force's name.
   */
  fileName: string
}>

/**
 * The possible metadata schema for an action target-argument
 * that is present in an effect's arguments.
 */
export type TActionMetadata = Partial<{
  /**
   * A force's local key.
   */
  forceKey: string
  /**
   * A force's name.
   */
  forceName: string
  /**
   * A node's local key.
   */
  nodeKey: string
  /**
   * A node's name.
   */
  nodeName: string
  /**
   * An action's local key.
   */
  actionKey: string
  /**
   * An action's name.
   */
  actionName: string
}>

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
  dependencies?: TargetDependency[]
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the argument.
   * @default undefined
   */
  tooltipDescription?: string
}

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
