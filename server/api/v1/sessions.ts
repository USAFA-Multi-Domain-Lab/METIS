import { Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import { TCommonMissionJson } from 'metis/missions'
import MetisServer from 'metis/server'
import MissionModel from 'metis/server/database/models/missions'
import { databaseLogger, sessionLogger } from 'metis/server/logging'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import ServerMission from 'metis/server/missions'
import SessionServer from 'metis/server/sessions'
import ServerUser from 'metis/server/users'
import { TSessionBasicJson, TSessionConfig } from 'metis/sessions'
import { auth } from '../../middleware/users'

const routerMap = (
  router: expressWs.Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- CREATE ---------------------------- */

  /**
   * This will launch a session for a user to execute
   * a mission.
   * @returns The ID of the newly launched session in JSON format.
   */
  const launchSession = (request: Request, response: Response) => {
    // Get data from the request body.
    let missionId: string = request.body.missionId
    let sessionConfig: TSessionConfig = {
      accessibility: request.body.accessibility,
      autoAssign: request.body.autoAssign,
      infiniteResources: request.body.infiniteResources,
      effectsEnabled: request.body.effectsEnabled,
    }
    let ownerId: string = response.locals.user._id
    let ownerUsername: string = response.locals.user.username

    // Query for mission.
    MissionModel.findOne({ _id: missionId })
      .lean()
      .exec(async (error: Error, missionData: TCommonMissionJson) => {
        // Handle errors.
        if (error !== null) {
          databaseLogger.error(
            `Failed to retrieve mission with ID "${missionId}".`,
          )
          databaseLogger.error(error)
          return response.sendStatus(500)
        }
        // Handle mission not found.
        else if (missionData === null) {
          return response.sendStatus(404)
        }

        try {
          // Create mission.
          let mission: ServerMission = new ServerMission(missionData, {
            populateTargets: sessionConfig.effectsEnabled,
          })
          // Launch the session.
          let session: SessionServer = SessionServer.launch(
            mission,
            sessionConfig,
            ownerId,
          )
          // Return the ID of the newly launched session
          // as JSON.
          return response.json({ sessionId: session._id })
        } catch (error: any) {
          sessionLogger.error('Failed to launch session.')
          sessionLogger.error(error)
          return response.sendStatus(500)
        }
      })
  }

  /* ---------------------------- READ ------------------------------ */

  /**
   * This will retrieve all publicly accessible sessions.
   * @returns All publicly accessible sessions in JSON format.
   */
  const getSessions = (request: Request, response: Response) => {
    // Define an array to store the sessions.
    let sessions: TSessionBasicJson[] = []
    let user: ServerUser = response.locals.user
    let hasAccess: boolean = user.isAuthorized(['sessions_write'])

    // Loop through all sessions and add the public sessions
    // to the array.
    for (let session of SessionServer.getAll()) {
      if (session.config.accessibility === 'public' || hasAccess) {
        sessions.push(session.toBasicJson())
      }
    }

    // Return the response as JSON.
    return response.json(sessions)
  }

  /* ---------------------------- UPDATE ---------------------------- */

  /* ---------------------------- DELETE ---------------------------- */

  /**
   * This will delete a session.
   * @returns HTTP status code.
   */
  const deleteSession = (request: Request, response: Response) => {
    let _id: string = request.params._id
    let session: SessionServer | undefined = SessionServer.get(_id)

    // Send 404 if session could not be found.
    if (session === undefined) {
      return response.sendStatus(404)
    }

    // Destroy session and return response.
    session.destroy()
    return response.sendStatus(200)
  }

  /* ---------------------------- ROUTES ---------------------------- */

  router.get('/', auth({}), getSessions)
  router.post(
    '/launch/',
    auth({ permissions: ['sessions_write', 'missions_read'] }),
    defineRequests(
      {
        body: {
          missionId: RequestBodyFilters.OBJECTID,
        },
      },
      {
        body: {
          accessibility: RequestBodyFilters.STRING_LITERAL<
            TSessionConfig['accessibility']
          >(['public', 'id-required', 'invite-only']),
          autoAssign: RequestBodyFilters.BOOLEAN,
          infiniteResources: RequestBodyFilters.BOOLEAN,
          effectsEnabled: RequestBodyFilters.BOOLEAN,
        },
      },
    ),
    launchSession,
  )
  router.delete(
    '/:_id/',
    auth({ permissions: ['sessions_write'] }),
    deleteSession,
  )

  done()
}

export default routerMap
