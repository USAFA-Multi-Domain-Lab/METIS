import type { TMetisClientComponents } from '@client/index'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'
import type { TTargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'

/**
 * Client implementation of {@link TargetArgument}.
 */
export class ClientTargetArgument extends TargetArgument<TMetisClientComponents> {
  /**
   * Creates a {@link ClientTargetArgument} from JSON.
   * @param json The JSON to create the argument from.
   * @param effect The effect to which the argument belongs.
   * @returns The new {@link ClientTargetArgument}.
   */
  public static fromJson(
    json: TTargetArgumentJson,
    effect: ClientEffect,
  ): ClientTargetArgument {
    let parameter = effect.target?.getParameterById(json.parameterId)

    // Default to parameter type if type is unknown in
    // the argument.
    if (json.type === 'unknown' && parameter) {
      json = { ...json, type: parameter.type as any }
    }

    ClientTargetArgument.applyDefault(json, parameter)

    let context = ClientTargetArgument.buildContext<TMetisClientComponents>(
      json,
      effect.normalize(),
    )
    return new ClientTargetArgument(effect, json._id, json.parameterId, context)
  }

  /**
   * Creates a {@link ClientTargetArgument} with a default value for the given parameter.
   * @param parameter The parameter to create a default argument for.
   * @param effect The effect to which the argument belongs.
   * @returns The new {@link ClientTargetArgument}.
   */
  public static createDefault(
    parameter: TTargetParameter,
    effect: ClientEffect,
  ): ClientTargetArgument {
    let _id = StringToolbox.generateRandomId()
    let context =
      ClientTargetArgument.buildDefaultContext<TMetisClientComponents>(
        parameter,
      )

    return new ClientTargetArgument(effect, _id, parameter._id, context)
  }

  /**
   * Duplicates this argument, creating a new instance bound to the
   * provided effect with a fresh `_id` but the same parameter values.
   * @param effect The effect to which the duplicated argument belongs.
   * @returns A new {@link ClientTargetArgument} with a fresh `_id`.
   */
  public duplicate(effect: ClientEffect): ClientTargetArgument {
    return ClientTargetArgument.fromJson(
      { ...this.json, _id: StringToolbox.generateRandomId() },
      effect,
    )
  }
}
