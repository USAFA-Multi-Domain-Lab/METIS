import { MissionModel } from '@server/database/models/missions'
import { ServerMission } from '@server/missions/ServerMission'
import { SessionServer } from '@server/sessions/SessionServer'
import type { ServerUser } from '@server/users/ServerUser'
import type { TSessionConfig } from '@shared/sessions/Session'
import { databaseLogger, sessionLogger } from '../../../../logging'
import { ApiResponse } from '../../library/ApiResponse'
import { StatusError } from '../../library/StatusError'

/**
 * This will launch a session for a user to execute a mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The ID of the newly launched session in JSON format.
 */
export const launchSession: TExpressHandler = async (request, response) => {
  // Get data from the request body.
  let { missionId, name, accessibility, infiniteResources, effectsEnabled } =
    request.body

  // Define the session configuration.
  let sessionConfig: TSessionConfig = {
    name: name ?? SessionServer.DEFAULT_CONFIG.name,
    accessibility: accessibility ?? SessionServer.DEFAULT_CONFIG.accessibility,
    infiniteResources:
      infiniteResources ?? SessionServer.DEFAULT_CONFIG.infiniteResources,
    effectsEnabled:
      effectsEnabled ?? SessionServer.DEFAULT_CONFIG.effectsEnabled,
  }

  // Get the user who is launching the session.
  let owner: ServerUser = response.locals.user

  try {
    // Query for mission.
    let missionDoc = await MissionModel.findById(missionId).exec()
    // If mission is not found, throw an error.
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    // Create mission.
    let mission = ServerMission.fromSaveJson(missionDoc.toJSON())
    // Launch the session.
    let session: SessionServer = SessionServer.launch(
      mission,
      sessionConfig,
      owner,
    )

    try {
      await MissionModel.updateOne(
        { _id: missionId },
        { $set: { launchedAt: new Date().toISOString() } },
        { timestamps: false },
      )
    } catch (error: any) {
      const databaseError = new Error(
        `Failed to update launchedAt for mission "{ _id: ${missionDoc._id}, name: ${missionDoc.name} }".\n`,
      )
      databaseLogger.error(databaseError.message, error)
      SessionServer.destroy(session._id)
      throw error
    }

    // Return the ID of the newly launched session as JSON.
    return ApiResponse.sendJson(response, { sessionId: session._id })
  } catch (error: any) {
    // Log the error.
    sessionLogger.error('Failed to launch session.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}
