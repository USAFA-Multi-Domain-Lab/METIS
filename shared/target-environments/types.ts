import type zod from 'zod'
import type { TargetEnvConfig } from './TargetEnvConfig'
import type { TargetDependency } from './targets/TargetDependency'

/**
 * The base parameter type for a target.
 */
export type TBaseTargetParameter = {
  /**
   * The ID of the parameter.
   */
  _id: string
  /**
   * The parameter's name. This is displayed to the user.
   */
  name: string
  /**
   * The grouping ID of the parameter.
   * @note This is used to group parameters together in the target-effect interface.
   * @default undefined
   */
  groupingId?: string
  /**
   * These are the IDs of the parameters that this parameter depends on.
   * @note If the parameter depends on another parameter, the parameter will only be displayed if the dependency is met.
   * @note If the parameter depends on multiple parameters, all dependencies must be met for the parameter to be displayed.
   * @note If the parameter has no dependencies (i.e. set to `undefined` or `[]`), the parameter will always be displayed.
   * @default undefined
   * @example
   * ```typescript
   * // This parameter is always displayed because it has no dependencies.
   * {
   *    _id: 'parameter1',
   *    name: 'Parameter 1',
   *    required: true,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    default: 0,
   * },
   * // This parameter is only displayed if the value of 'parameter1' is truthy (i.e. 1, 'a', true, etc.)
   * // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   * {
   *    _id: 'parameter2',
   *    name: 'Parameter 2',
   *    required: false,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    dependencies: [Dependency.TRUTHY('parameter1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This parameter is always displayed because it has no dependencies.
   * {
   *    _id: 'parameter1',
   *    name: 'Parameter 1',
   *    required: true,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    default: 0,
   * },
   * // This parameter is only displayed if the value of 'parameter1' is equal to 1, 2, or 3.
   * {
   *    _id: 'parameter2',
   *    name: 'Parameter 2',
   *    required: false,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    dependencies: [Dependency.SOME('parameter1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: TargetDependency[]
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the parameter.
   * @default undefined
   */
  tooltipDescription?: string
}

/**
 * The JSON representation of the base parameter type for a target.
 */
export type TBaseTargetParameterJson = {
  /**
   * The ID of the parameter.
   */
  _id: string
  /**
   * The parameter's name. This is displayed to the user.
   */
  name: string
  /**
   * The grouping ID of the parameter.
   * @note This is used to group parameters together in the target-effect interface.
   * @default undefined
   */
  groupingId?: string
  /**
   * These are the IDs of the parameters that this parameter depends on.
   * @note If the parameter depends on another parameter, the parameter will only be displayed if the dependency is met.
   * @note If the parameter depends on multiple parameters, all dependencies must be met for the parameter to be displayed.
   * @note If the parameter has no dependencies (i.e. set to `undefined` or `[]`), the parameter will always be displayed.
   * @default undefined
   * @example
   * ```typescript
   * // This parameter is always displayed because it has no dependencies.
   * {
   *    _id: 'parameter1',
   *    name: 'Parameter 1',
   *    required: true,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    default: 0,
   * },
   * // This parameter is only displayed if the value of 'parameter1' is truthy (i.e. 1, 'a', true, etc.)
   * // or not falsy (i.e. null, undefined, 0, false, '', etc.).
   * {
   *    _id: 'parameter2',
   *    name: 'Parameter 2',
   *    required: false,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    dependencies: [Dependency.TRUTHY('parameter1')],
   * }
   * ```
   *
   * @example
   * ```typescript
   * // This parameter is always displayed because it has no dependencies.
   * {
   *    _id: 'parameter1',
   *    name: 'Parameter 1',
   *    required: true,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    default: 0,
   * },
   * // This parameter is only displayed if the value of 'parameter1' is equal to 1, 2, or 3.
   * {
   *    _id: 'parameter2',
   *    name: 'Parameter 2',
   *    required: false,
   *    groupingId: 'parameter',
   *    type: 'number',
   *    dependencies: [Dependency.SOME('parameter1', [1, 2, 3])],
   * }
   * ```
   */
  dependencies?: string[]
  /**
   * This will be used for a hover-over tooltip.
   * @note This can be used to provide additional information or clarification about the parameter.
   * @default undefined
   */
  tooltipDescription?: string
}

/**
 * Represents the configuration for a target environment.
 */
export type TTargetEnvConfig = zod.infer<typeof TargetEnvConfig.schema>
