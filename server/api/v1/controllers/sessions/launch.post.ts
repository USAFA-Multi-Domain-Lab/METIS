import { Request, Response } from 'express-serve-static-core'
import MissionModel from 'metis/server/database/models/missions'
import { StatusError } from 'metis/server/http'
import { sessionLogger } from 'metis/server/logging'
import ServerMission from 'metis/server/missions'
import SessionServer from 'metis/server/sessions'
import ServerUser from 'metis/server/users'
import Session, { TSessionConfig } from 'metis/sessions'
import ApiResponse from '../../library/response'
/**
 * This will launch a session for a user to execute a mission.
 * @param request The express request.
 * @param response The express response.
 * @returns The ID of the newly launched session in JSON format.
 */
const launchSession = async (request: Request, response: Response) => {
  // Get data from the request body.
  let {
    missionId,
    name,
    accessibility,
    autoAssign,
    infiniteResources,
    effectsEnabled,
  } = request.body

  // Define the session configuration.
  let sessionConfig: TSessionConfig = {
    name: name ?? Session.DEFAULT_CONFIG.name,
    accessibility: accessibility ?? Session.DEFAULT_CONFIG.accessibility,
    autoAssign: autoAssign ?? Session.DEFAULT_CONFIG.autoAssign,
    infiniteResources:
      infiniteResources ?? Session.DEFAULT_CONFIG.infiniteResources,
    effectsEnabled: effectsEnabled ?? Session.DEFAULT_CONFIG.effectsEnabled,
  }

  // Get the user who is launching the session.
  let owner: ServerUser = response.locals.user

  try {
    // Query for mission.
    let missionDoc = await MissionModel.findById(missionId)
      .populate('files.reference')
      .exec()
    // If mission is not found, throw an error.
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    // Create mission.
    let mission = new ServerMission(missionDoc.toJSON())
    // Launch the session.
    let session: SessionServer = SessionServer.launch(
      mission,
      sessionConfig,
      owner,
    )
    // Update `launchedAt` for the mission to track
    // the last time the mission was launched.
    missionDoc.launchedAt = new Date().toISOString()
    await missionDoc.save()
    // Return the ID of the newly launched session as JSON.
    return ApiResponse.sendJson(response, { sessionId: session._id })
  } catch (error: any) {
    // Log the error.
    sessionLogger.error('Failed to launch session.\n', error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default launchSession
