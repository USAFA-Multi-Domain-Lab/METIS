import ObjectId from 'src/object-id'
import { TClientMissionTypes, TMissionNavigable } from '..'
import MissionAction, {
  TCommonMissionActionJson,
  TMissionActionOptions,
} from '../../../../shared/missions/actions'
import { TCommonEffectJson } from '../../../../shared/missions/effects'
import { ClientEffect, TClientEffectOptions } from '../effects'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction
  extends MissionAction<TClientMissionTypes>
  implements TMissionNavigable
{
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this]
  }

  // Implemented
  protected parseEffects(
    data: TCommonEffectJson[],
    options: TClientEffectOptions = {},
  ): ClientEffect[] {
    return data.map(
      (datum: TCommonEffectJson) => new ClientEffect(this, datum, options),
    )
  }

  /**
   * Exports the action as a JSON object.
   * @resolves The JSON object representing the action.
   * @rejects If there was an error exporting the action.
   */
  public async initExport(): Promise<TCommonMissionActionJson> {
    return new Promise<TCommonMissionActionJson>(async (resolve, reject) => {
      try {
        // Generate a new object ID for the action.
        this._id = await ObjectId.$fetch()
        // Create the JSON object.
        let json: TCommonMissionActionJson = {
          _id: this._id,
          name: this.name,
          description: this.description,
          processTime: this.processTime,
          successChance: this.successChance,
          resourceCost: this.resourceCost,
          postExecutionSuccessText: this.postExecutionSuccessText,
          postExecutionFailureText: this.postExecutionFailureText,
          effects: await Promise.all(
            this.effects.map(async (effect) => await effect.initExport()),
          ),
        }
        // Resolve the JSON object.
        resolve(json)
      } catch (error: any) {
        // Log the error.
        console.error('Failed to export the action.')
        console.error(error)
        reject(error)
      }
    })
  }
}

/* ------------------------------ CLIENT ACTION TYPES ------------------------------ */

/**
 * Options for creating a new ClientMissionAction object.
 */
export type TClientMissionActionOptions = TMissionActionOptions & {}
