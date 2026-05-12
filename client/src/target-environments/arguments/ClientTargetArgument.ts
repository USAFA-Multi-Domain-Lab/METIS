import type { TMetisClientComponents } from '@client/index'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import type { TTargetArgumentContext } from '@shared/target-environments/arguments/TargetArgument'
import {
  TargetArgument,
  type TTargetArgumentJson,
} from '@shared/target-environments/arguments/TargetArgument'
import type { TTargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import { ObjectToolbox } from '@shared/toolbox/objects/ObjectToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'

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
    let context: TTargetArgumentContext<TMetisClientComponents> = {
      type: 'unknown',
      value: null,
    }

    if (json.type === 'mission-component') {
      context = ObjectToolbox.lazy(
        {
          value: () =>
            ClientTargetArgument.extractAndDeserializeComponents<TMetisClientComponents>(
              effect.mission,
              json.value,
            ),
        },
        {
          type: 'mission-component',
        },
      )
    } else {
      context = {
        type: json.type,
        value: json.value,
      } as TTargetArgumentContext<TMetisClientComponents>
    }

    return new ClientTargetArgument(effect, json._id, json.parameterId, context)
  }

  /**
   * Creates a {@link ClientTargetArgument} with a default value for the given parameter.
   * @param parameter The parameter to create a default argument for.
   * @param effect The effect to which the argument belongs.
   * @returns The new {@link ClientTargetArgument}.
   */
  public static createDefaultParameter(
    parameter: TTargetParameter,
    effect: ClientEffect,
  ): ClientTargetArgument {
    const _id = StringToolbox.generateRandomId()

    let context: TTargetArgumentContext<TMetisClientComponents>

    switch (parameter.type) {
      case 'number':
        context = {
          type: 'number',
          value: parameter.required ? parameter.default : null,
        }
        break
      case 'string':
        context = {
          type: 'string',
          value: parameter.required ? parameter.default : '',
        }
        break
      case 'large-string':
        context = {
          type: 'large-string',
          value: parameter.required ? parameter.default : '',
        }
        break
      case 'boolean':
        context = { type: 'boolean', value: parameter.default ?? false }
        break
      case 'dropdown':
        context = {
          type: 'dropdown',
          value: parameter.required ? parameter.default : null,
        }
        break
      case 'mission-component':
        context = { type: 'mission-component', value: [] }
        break
    }

    return new ClientTargetArgument(effect, _id, parameter._id, context)
  }
}
