import { MissionModel } from '@server/database/models/missions'
import { ServerMission } from '@server/missions/ServerMission'
import type { ServerUser } from '@server/users/ServerUser'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { StatusError } from '../api/v1/library/StatusError'
import { databaseLogger } from '../logging'
import { SessionServer } from './SessionServer'

/**
 * Fetches the mission, launches a session for it, and persists the
 * mission's `launchedAt` timestamp.
 * @param missionId The ID of the mission to launch a session for.
 * @param config The configuration for the session.
 * @param owner The user launching the session.
 * @returns The newly launched session.
 * @throws {StatusError} If the mission is not found.
 * @throws If persisting `launchedAt` fails (the session is destroyed first).
 */
export async function launchSessionCore(
  missionId: string,
  config: TSessionConfig,
  owner: ServerUser,
): Promise<SessionServer> {
  // Query for mission.
  let missionDoc = await MissionModel.findById(missionId).exec()
  // If mission is not found, throw an error.
  if (missionDoc === null) {
    throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
  }

  // Create mission and launch the session.
  let mission = ServerMission.fromSaveJson(missionDoc.toJSON())
  let session: SessionServer = SessionServer.launch(mission, config, owner)

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

  return session
}
