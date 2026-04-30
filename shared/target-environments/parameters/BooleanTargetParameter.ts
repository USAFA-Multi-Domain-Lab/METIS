import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The boolean parameter type for a target.
 */
export class BooleanTargetParameter {
  /**
   * Converts TBooleanArg to TBooleanArgJson.
   * @param arg The boolean argument to convert.
   * @returns The boolean argument as JSON.
   */
  public static toJson = (
    arg: TBooleanTargetParameter,
  ): TBooleanTargetParameterJson => {
    return {
      _id: arg._id,
      name: arg.name,
      groupingId: arg.groupingId,
      dependencies: arg.dependencies
        ? TargetParameter.encodeDependencies(arg.dependencies)
        : undefined,
      tooltipDescription: arg.tooltipDescription,
      type: arg.type,
      default: arg.default,
    }
  }

  /**
   * Converts TBooleanArgJson to TBooleanArg.
   * @param arg The boolean argument as JSON to convert.
   * @returns The boolean argument.
   */
  public static fromJson = (
    arg: TBooleanTargetParameterJson,
  ): TBooleanTargetParameter => {
    return {
      _id: arg._id,
      name: arg.name,
      groupingId: arg.groupingId,
      dependencies: arg.dependencies
        ? TargetParameter.decodeDependencies(arg.dependencies)
        : undefined,
      tooltipDescription: arg.tooltipDescription,
      type: arg.type,
      default: arg.default,
    }
  }
}

/* -- TYPES -- */

/**
 * The boolean parameter type for a target.
 */
export type TBooleanTargetParameter = TBaseTargetParameter & {
  /**
   * The argument's input type.
   * @note This will render as a toggle switch.
   */
  type: 'boolean'
  /**
   * The default value for the argument.
   */
  default?: boolean
}
/**
 * The boolean parameter type for a target.
 */
export type TBooleanTargetParameterJson = TBaseTargetParameterJson & {
  /**
   * The argument's input type.
   * @note This will render as a toggle switch.
   */
  type: 'boolean'
  /**
   * The default value for the argument.
   */
  default?: boolean
}
