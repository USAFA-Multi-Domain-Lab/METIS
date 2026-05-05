import type { TMetisClientComponents } from '@client/index'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import type { TTargetArgumentContext } from '@shared/target-environments/arguments/TargetArgument'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'

/**
 * Client implementation of {@link TargetArgument}.
 */
export class ClientTargetArgument extends TargetArgument<TMetisClientComponents> {
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
  ): ClientTargetArgument {
    let context: TTargetArgumentContext = {
      type: 'unknown',
      value: null,
    }

    if (json.type === 'mission-component') {
      context = {
        type: 'mission-component',
        value: ClientTargetArgument.extractAndDeserializeComponents(
          effect.mission,
          json.value,
        ),
      }
    } else {
      context = {
        type: json.type,
        value: json.value,
      } as TTargetArgumentContext
    }

    return new ClientTargetArgument(effect, json._id, json.parameterId, context)
  }
}
