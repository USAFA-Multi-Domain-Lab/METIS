import type { TBaseTargetParameter, TBaseTargetParameterJson } from '../types'
import { TargetParameter } from './TargetParameter'

/**
 * The boolean parameter type for a target.
 */
export class BooleanTargetParameter {
  /**
   * Converts TBooleanTargetParameter to TBooleanTargetParameterJson.
   * @param parameter The boolean parameter to convert.
   * @returns The boolean parameter as JSON.
   */
  public static toJson = (
    parameter: TBooleanTargetParameter,
  ): TBooleanTargetParameterJson => {
    return {
      _id: parameter._id,
      name: parameter.name,
      groupingId: parameter.groupingId,
      dependencies: parameter.dependencies
        ? TargetParameter.encodeDependencies(parameter.dependencies)
        : undefined,
      tooltipDescription: parameter.tooltipDescription,
      type: parameter.type,
      default: parameter.default,
    }
  }

  /**
   * Converts TBooleanTargetParameterJson to TBooleanTargetParameter.
   * @param parameter The boolean parameter as JSON to convert.
   * @returns The boolean parameter.
   */
  public static fromJson = (
    parameter: TBooleanTargetParameterJson,
  ): TBooleanTargetParameter => {
    return {
      _id: parameter._id,
      name: parameter.name,
      groupingId: parameter.groupingId,
      dependencies: parameter.dependencies
        ? TargetParameter.decodeDependencies(parameter.dependencies)
        : undefined,
      tooltipDescription: parameter.tooltipDescription,
      type: parameter.type,
      default: parameter.default,
    }
  }
}

/* -- TYPES -- */

/**
 * The boolean parameter type for a target.
 */
export type TBooleanTargetParameter = TBaseTargetParameter & {
  /**
   * The parameter's input type.
   * @note This will render as a toggle switch.
   */
  type: 'boolean'
  /**
   * The default value for the parameter.
   */
  default?: boolean
}
/**
 * The boolean parameter type for a target.
 */
export type TBooleanTargetParameterJson = TBaseTargetParameterJson & {
  /**
   * The parameter's input type.
   * @note This will render as a toggle switch.
   */
  type: 'boolean'
  /**
   * The default value for the parameter.
   */
  default?: boolean
}
