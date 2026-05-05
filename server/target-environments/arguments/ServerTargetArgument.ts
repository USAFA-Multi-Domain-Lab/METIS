import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { TTargetArgumentContext } from '@shared/target-environments/arguments/TargetArgument'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'

/**
 * Server implementation of {@link TargetArgument}.
 */
export class ServerTargetArgument extends TargetArgument<TMetisServerComponents> {
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
  ): ServerTargetArgument {
    let context: TTargetArgumentContext = {
      type: 'unknown',
      value: null,
    }

    if (json.type === 'mission-component') {
      context = {
        type: 'mission-component',
        value: ServerTargetArgument.extractAndDeserializeComponents(
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

    return new ServerTargetArgument(effect, json._id, json.parameterId, context)
  }
}
