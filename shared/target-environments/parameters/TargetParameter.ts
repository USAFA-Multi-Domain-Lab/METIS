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
  MissionComponentTargetParameter,
  type TMissionComponentTargetParameter,
  type TMissionComponentTargetParameterJson,
} from './mission-component/MissionComponentTargetParameter'
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
   * Encodes the parameter dependencies.
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
    return parameters.map((parameter: TTargetParameter) => {
      switch (parameter.type) {
        case 'number':
          return NumberTargetParameter.toJson(parameter)
        case 'string':
          return StringTargetParameter.toJson(parameter)
        case 'large-string':
          return LargeStringTargetParameter.toJson(parameter)
        case 'dropdown':
          return DropdownTargetParameter.toJson(parameter)
        case 'boolean':
          return BooleanTargetParameter.toJson(parameter)
        case 'mission-component':
          return MissionComponentTargetParameter.toJson(parameter)
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
          return MissionComponentTargetParameter.fromJson(parameter)
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
  'mission-component': TMissionComponentTargetParameter
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
  | TMissionComponentTargetParameter

/**
 * The parameters used for the target-effect interface and the target-effect API.
 */
export type TTargetParameterJson =
  | TNumberTargetParameterJson
  | TStringTargetParameterJson
  | TLargeStringTargetParameterJson
  | TDropdownTargetParameterJson
  | TBooleanTargetParameterJson
  | TMissionComponentTargetParameterJson
