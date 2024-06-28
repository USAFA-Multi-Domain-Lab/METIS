import ClientTarget from 'src/target-environments/targets'
import { TClientMissionTypes, TMissionNavigable } from '..'
import Effect from '../../../../shared/missions/effects'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect
  extends Effect<TClientMissionTypes>
  implements TMissionNavigable
{
  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this.action, this]
  }

  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Populate the target data.
        this._target = await ClientTarget.$fetchOne(targetId)
        // Resolve the promise.
        resolve()
      } catch (error: any) {
        // Log the error.
        console.error('Error loading target data for effect.\n', error)
        // Reject the promise.
        reject(error)
      }
    })
  }
}
