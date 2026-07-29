import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { TSelectArgumentSerializedValue } from '@shared/target-environments/arguments/TargetArgument'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'
import type {
  TTargetParameter,
  TTargetParameterType,
} from '@shared/target-environments/parameters/TargetParameter'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type {
  TTargetEnvExposedAction,
  TTargetEnvExposedFile,
  TTargetEnvExposedForce,
  TTargetEnvExposedMission,
  TTargetEnvExposedNode,
  TTargetEnvExposedPool,
  TTargetEnvExposedResource,
} from '../context/TargetEnvContext'

/**
 * Server implementation of {@link TargetArgument}.
 */
export class ServerTargetArgument extends TargetArgument<TMetisServerComponents> {
  /**
   * Creates a {@link ServerTargetArgument} from JSON.
   * @param json The JSON to create the argument from.
   * @param effect The effect to which the argument belongs.
   * @returns The new {@link ServerTargetArgument}.
   */
  public static fromJson(
    json: TTargetArgumentJson,
    effect: ServerEffect,
  ): ServerTargetArgument {
    let parameter = effect.target?.getParameterById(json.parameterId)

    if (json.type === 'unknown' && parameter) {
      json = { ...json, type: parameter.type as any }
    }

    ServerTargetArgument.applyDefault(json, parameter)

    let context = ServerTargetArgument.buildContext<TMetisServerComponents>(
      json,
      effect.normalize(),
    )
    return new ServerTargetArgument(effect, json._id, json.parameterId, context)
  }

  /**
   * Creates a {@link ServerTargetArgument} with a default value for the given parameter.
   * @param parameter The parameter to create a default argument for.
   * @param effect The effect to which the argument belongs.
   * @returns The new {@link ServerTargetArgument}.
   */
  public static createDefault(
    parameter: TTargetParameter,
    effect: ServerEffect,
  ): ServerTargetArgument {
    let _id = StringToolbox.generateRandomId()
    let context =
      ServerTargetArgument.buildDefaultContext<TMetisServerComponents>(
        parameter,
      )

    return new ServerTargetArgument(effect, _id, parameter._id, context)
  }

  /**
   * @returns Exposed version of this argument that can be
   * safely passed to target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedArgument {
    if (this.context.type === 'mission-component') {
      return {
        _id: this._id,
        parameterId: this.parameterId,
        type: this.context.type,
        value: this.context.value.map((component) =>
          component.toTargetEnvContext(),
        ),
      }
    } else {
      return {
        _id: this._id,
        parameterId: this.parameterId,
        ...this.context,
      }
    }
  }
}

/* -- TYPES -- */

/**
 * A union of all possible mission components that can be exposed
 * to target-environment code.
 */
export type TExposedArgCompatibleComponent =
  | TTargetEnvExposedMission
  | TTargetEnvExposedResource
  | TTargetEnvExposedForce
  | TTargetEnvExposedPool
  | TTargetEnvExposedNode
  | TTargetEnvExposedAction
  | TTargetEnvExposedFile

/**
 * Allows the selection of a context argument value's type
 * which can be passed to a target-env script.
 */
export type TSelectExposedArgumentValue = Omit<
  TSelectArgumentSerializedValue,
  'mission-component'
> & {
  'mission-component': TExposedArgCompatibleComponent[]
}

/**
 * The exposed representation of {@link TargetArgument} — what
 * {@link ServerTargetArgument.toTargetEnvContext} hands to target-environment
 * code. Distinct from `TTargetArgumentJson`, which is the serialized form that
 * gets stored: a `mission-component` value here is a list of exposed
 * components rather than the serialized selections written to the database.
 */
export type TTargetEnvExposedArgument = {
  [TType in TTargetParameterType]: {
    /**
     * @see {@link TargetArgument._id}
     */
    _id: string
    /**
     * @see {@link TargetArgument.parameterId}
     */
    parameterId: string
    /**
     * @see {@link TargetArgument.type}
     */
    type: TType
    /**
     * @see {@link TargetArgument.value}
     */
    value: TSelectExposedArgumentValue[TType]
  }
}[TTargetParameterType]
