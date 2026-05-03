import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import {
  TargetArgument,
  TTargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'
import type { TTargetParameterType } from '@shared/target-environments/parameters/TargetParameter'

/**
 * Server implementation of {@link TargetArgument}.
 */
export class ServerTargetArgument<
  TType extends TTargetParameterType = TTargetParameterType,
> extends TargetArgument<TMetisServerComponents, TType> {
  /**
   * Creates a {@link ServerTargetArgument} from JSON.
   * @param json The JSON to create the argument from.
   * @param effect The effect to which the argument belongs.
   * @param target The target whose parameter list is used to resolve
   * the parameter reference in the JSON.
   * @returns The new {@link ServerTargetArgument}.
   * @throws If the parameter with the given ID cannot be found in the target.
   */
  public static fromJson(
    json: TTargetArgumentJson,
    effect: ServerEffect,
  ): TServerTargetArgument {
    return new ServerTargetArgument(
      effect,
      json._id,
      json.parameterId,
      json.type,
      json.value,
    ) as TServerTargetArgument
  }
}

/**
 * Server implementation of {@link TTargetArgument}.
 */
export type TServerTargetArgument = {
  [K in TTargetParameterType]: Omit<
    ServerTargetArgument<K>,
    'value' | 'parameter' | 'type'
  > &
    ServerTargetArgument<K>
}[TTargetParameterType]
