import { SessionServer } from '@server/sessions/SessionServer'
import { launchSessionCore } from '@server/sessions/launchSessionCore'
import type { ServerUser } from '@server/users/ServerUser'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { sessionLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will launch a session for a user to execute a mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The ID of the newly launched session in JSON format.
 * @note Play-tests (`isTest`) are rejected here — they must come through
 * the WS `request-play-test` method, which binds the disposable session's
 * lifecycle to the owner's connection.
 */
export const launchSession: TExpressHandler = async (request, response) => {
  // Get data from the request body.
  let {
    missionId,
    name,
    accessibility,
    mode,
    isTest,
    singlePlayerForceId,
    infiniteResources,
    disabledTargetEnvs,
    targetEnvConfigs,
  } = request.body

  try {
    // Reject play-test launches — those go through the WS play-test method.
    if (isTest) {
      throw new StatusError(
        'Play-test sessions must be launched via the play-test method in the WebSocket API.',
        400,
      )
    }

    // Define the session configuration.
    let sessionConfig: TSessionConfig = {
      name: name ?? SessionServer.DEFAULT_CONFIG.name,
      accessibility:
        accessibility ?? SessionServer.DEFAULT_CONFIG.accessibility,
      mode: mode ?? SessionServer.DEFAULT_CONFIG.mode,
      isTest: false,
      singlePlayerForceId,
      infiniteResources:
        infiniteResources ?? SessionServer.DEFAULT_CONFIG.infiniteResources,
      disabledTargetEnvs:
        disabledTargetEnvs ?? SessionServer.DEFAULT_CONFIG.disabledTargetEnvs,
      targetEnvConfigs:
        targetEnvConfigs ?? SessionServer.DEFAULT_CONFIG.targetEnvConfigs,
    }

    // Get the user who is launching the session.
    let owner: ServerUser = response.locals.user

    // Launch the session.
    let session = await launchSessionCore(missionId, sessionConfig, owner)

    // Return the ID of the newly launched session as JSON.
    return ApiResponse.sendJson(response, { sessionId: session._id })
  } catch (error: any) {
    // Log the error.
    sessionLogger.error('Failed to launch session.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
