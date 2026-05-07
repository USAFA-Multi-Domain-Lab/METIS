import { TargetDependency } from '../targets/TargetDependency'
import type {
  TBooleanTargetParameter,
  TBooleanTargetParameterJson,
} from './BooleanTargetParameter'
import { BooleanTargetParameter } from './BooleanTargetParameter'
import type {
  TDropdownTargetParameter,
  TDropdownTargetParameterJson,
} from './DropdownTargetParameter'
import { DropdownTargetParameter } from './DropdownTargetParameter'
import type {
  TLargeStringTargetParameter,
  TLargeStringTargetParameterJson,
} from './LargeStringTargetParameter'
import { LargeStringTargetParameter } from './LargeStringTargetParameter'
import {
  MissionComponentTargetParameter2,
  type TMissionComponentTargetParameter2,
  type TMissionComponentTargetParameterJson2,
} from './mission-component/MissionComponentTargetParameter2'
import type {
  TNumberTargetParameter,
  TNumberTargetParameterJson,
} from './NumberTargetParameter'
import { NumberTargetParameter } from './NumberTargetParameter'
import type {
  TStringTargetParameter,
  TStringTargetParameterJson,
} from './StringTargetParameter'
import { StringTargetParameter } from './StringTargetParameter'

/**
 * Represents the base parameter type for a target.
 */
export class TargetParameter {
  /**
   * Decodes all dependencies.
   * @param dependencies The dependencies to decode.
   * @returns The decoded dependencies.
   */
  public static decodeDependencies = (
    dependencies: string[],
  ): TargetDependency[] => {
    return dependencies.map((dependency: string) => {
      return TargetDependency.DECODE(dependency)
    })
  }

  /**
   * Encodes the argument dependencies.
   * @param dependencies The dependencies to encode.
   * @returns The encoded dependencies.
   */
  public static encodeDependencies = (
    dependencies: TargetDependency[],
  ): string[] => {
    return dependencies.map((dependency: TargetDependency) => {
      return dependency.encode()
    })
  }

  /**
   * Converts parameters to JSON.
   * @param parameters The parameters to convert.
   * @returns The parameters as JSON.
   */
  public static toJson = (
    parameters: TTargetParameter[],
  ): TTargetParameterJson[] => {
    return parameters.map((arg: TTargetParameter) => {
      switch (arg.type) {
        case 'number':
          return NumberTargetParameter.toJson(arg)
        case 'string':
          return StringTargetParameter.toJson(arg)
        case 'large-string':
          return LargeStringTargetParameter.toJson(arg)
        case 'dropdown':
          return DropdownTargetParameter.toJson(arg)
        case 'boolean':
          return BooleanTargetParameter.toJson(arg)
        case 'mission-component':
          return MissionComponentTargetParameter2.toJson(arg)
      }
    })
  }

  /**
   * Converts parameters from JSON.
   * @param parameters The parameters as JSON to convert.
   * @returns The parameters.
   */
  public static fromJson = (
    parameters: TTargetParameterJson[],
  ): TTargetParameter[] => {
    return parameters.map((parameter: TTargetParameterJson) => {
      switch (parameter.type) {
        case 'number':
          return NumberTargetParameter.fromJson(parameter)
        case 'string':
          return StringTargetParameter.fromJson(parameter)
        case 'large-string':
          return LargeStringTargetParameter.fromJson(parameter)
        case 'dropdown':
          return DropdownTargetParameter.fromJson(parameter)
        case 'boolean':
          return BooleanTargetParameter.fromJson(parameter)
        case 'mission-component':
          return MissionComponentTargetParameter2.fromJson(parameter)
      }
    })
  }
}

/* -- TYPES -- */

export type TSelectTargetParameter = {
  'number': TNumberTargetParameter
  'string': TStringTargetParameter
  'large-string': TLargeStringTargetParameter
  'dropdown': TDropdownTargetParameter
  'boolean': TBooleanTargetParameter
  'mission-component': TMissionComponentTargetParameter2
  'unknown': TTargetParameter
}

export type TTargetParameterType = keyof TSelectTargetParameter

/**
 * The parameters used for the target-effect interface and the target-effect API.
 */
export type TTargetParameter =
  | TNumberTargetParameter
  | TStringTargetParameter
  | TLargeStringTargetParameter
  | TDropdownTargetParameter
  | TBooleanTargetParameter
  | TMissionComponentTargetParameter2

/**
 * The parameters used for the target-effect interface and the target-effect API.
 */
export type TTargetParameterJson =
  | TNumberTargetParameterJson
  | TStringTargetParameterJson
  | TLargeStringTargetParameterJson
  | TDropdownTargetParameterJson
  | TBooleanTargetParameterJson
  | TMissionComponentTargetParameterJson2
