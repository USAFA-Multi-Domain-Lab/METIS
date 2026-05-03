import type { TMetisClientComponents } from '@client/index'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import type { TTargetArgument } from '@shared/target-environments/arguments/TargetArgument'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'
import type { TTargetParameterType } from '@shared/target-environments/parameters/TargetParameter'

/**
 * Client implementation of {@link TargetArgument}.
 */
export class ClientTargetArgument<
  TType extends TTargetParameterType = TTargetParameterType,
> extends TargetArgument<TMetisClientComponents, TType> {
  /**
   * Creates a {@link ClientTargetArgument} from JSON.
   * @param json The JSON to create the argument from.
   * @param effect The effect to which the argument belongs.
   * @param target The target whose parameter list is used to resolve
   * the parameter reference in the JSON.
   * @returns The new {@link ClientTargetArgument}.
   * @throws If the parameter with the given ID cannot be found in the target.
   */
  public static fromJson(
    json: TTargetArgumentJson,
    effect: ClientEffect,
  ): TClientTargetArgument {
    return new ClientTargetArgument(
      effect,
      json._id,
      json.parameterId,
      json.type,
      json.value,
    ) as TClientTargetArgument
  }
}

/**
 * Client implementation of {@link TTargetArgument}.
 */
export type TClientTargetArgument = {
  [K in TTargetParameterType]: Omit<
    ClientTargetArgument<K>,
    'value' | 'parameter' | 'type'
  > &
    ClientTargetArgument<K>
}[TTargetParameterType]
