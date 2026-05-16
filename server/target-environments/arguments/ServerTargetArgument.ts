import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { TSelectArgumentSerializedValue } from '@shared/target-environments/arguments/TargetArgument'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'
import type { TTargetParameterType } from '@shared/target-environments/parameters/TargetParameter'
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
   * @throws If the parameter with the given ID cannot be found in the target.
   */
  public static fromJson(
    json: TTargetArgumentJson,
    effect: ServerEffect,
  ): ServerTargetArgument {
    let parameter = effect.target?.getParameterById(json.parameterId)

    if (json.type === 'unknown' && parameter) {
      json = { ...json, type: parameter.type as any }
    }

    let context = ServerTargetArgument.buildContext<TMetisServerComponents>(
      json,
      effect.normalize(),
    )
    return new ServerTargetArgument(effect, json._id, json.parameterId, context)
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
 * The JSON representation of {@link TargetArgument}.
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
