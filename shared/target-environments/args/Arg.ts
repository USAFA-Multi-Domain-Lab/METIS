import { TargetDependency } from '../targets/TargetDependency'
import type { TMissionComponentArg, TMissionComponentArgJson } from '../types'
import type { TBooleanArg, TBooleanArgJson } from './BooleanArg'
import { BooleanArg } from './BooleanArg'
import type { TDropdownArg, TDropdownArgJson } from './DropdownArg'
import { DropdownArg } from './DropdownArg'
import type { TLargeStringArg, TLargeStringArgJson } from './LargeStringArg'
import { LargeStringArg } from './LargeStringArg'
import { MissionComponentArg } from './mission-component/MissionComponentArg'
import type { TNumberArg, TNumberArgJson } from './NumberArg'
import { NumberArg } from './NumberArg'
import type { TStringArg, TStringArgJson } from './StringArg'
import { StringArg } from './StringArg'

/**
 * Represents the base argument type for a target.
 */
export class Arg {
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
        case 'file':
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
        case 'file':
          return MissionComponentArg.fromJson(arg)
      }
    })
  }
}

/* -- TYPES -- */

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
 * The arguments used for the target-effect interface and the target-effect API.
 */
export type TTargetArgJson =
  | TNumberArgJson
  | TStringArgJson
  | TLargeStringArgJson
  | TDropdownArgJson
  | TBooleanArgJson
  | TMissionComponentArgJson
