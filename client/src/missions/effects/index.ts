import { AxiosRequestConfig } from 'axios'
import ClientMissionAction from '../actions'
import Effect from '../../../../shared/missions/effects'
import { AnyObject } from '../../../../shared/toolbox/objects'
// todo: fix https
// import https from 'https'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'

// todo: fix https
// /**
//  * An https agent that ignores self-signed certificates.
//  */
// const httpsAgent = new https.Agent({ rejectUnauthorized: false })

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect extends Effect<
  ClientMissionAction,
  ClientTargetEnvironment
> {
  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    try {
      // Update the target ajax status.
      this._targetAjaxStatus = 'Loading'
      // Load the target data.
      let target: ClientTarget = await ClientTarget.fetchOne(targetId)
      // If the target ID doesn't match the target
      // ID associated with the effect, throw an error.
      if (target.id !== targetId) {
        throw new Error(
          `The target "${target.name}" with the ID "${target.id}" does not match the target ID "${targetId}" associated with the effect "${this.name}".`,
        )
      }

      // Populate the target data.
      this._target = target
      // Update the target ajax status.
      this._targetAjaxStatus = 'Loaded'
    } catch (error: any) {
      // Update the target ajax status.
      this._targetAjaxStatus = 'Error'
      // Log the error.
      console.error('Error loading target data for effect.', error)
      // Throw the error.
      throw error
    }
  }

  // todo: remove (target-environment)
  // /**
  //  * Affects the target via the API given the provided arguments.
  //  */
  // public execute = async (): Promise<void> => {
  //   // Parse arguments into variables.
  //   let { entityName, requestPath, requestMethod, requestData } = this.args
  //   // URL to which the request will be made.
  //   let url: string = `${this.url}/${requestPath}/`
  //   // Configuration for the request.
  //   let config: AxiosRequestConfig<AnyObject> = {
  //     // todo: fix https
  //     // httpsAgent: httpsAgent,
  //   }

  //   try {
  //     // Makes the request to the API
  //     // to affect the entity with the given
  //     // method, path, and data.
  //     await ClientTargetEnvironment.makeRequest(
  //       requestMethod,
  //       url,
  //       requestData,
  //       config,
  //     )
  //   } catch (error: any) {
  //     console.log('Failed to execute effect.')
  //     console.log(error)
  //   }
  // }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */
