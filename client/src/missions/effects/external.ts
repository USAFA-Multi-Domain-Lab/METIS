import ClientTarget from 'src/target-environments/targets'
import { TClientMissionTypes } from '..'
import ExternalEffect from '../../../../shared/missions/effects/external'

/**
 * Class representing an external effect on the client-side that can be
 * applied to a target.
 */
export class ClientExternalEffect extends ExternalEffect<TClientMissionTypes> {
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
