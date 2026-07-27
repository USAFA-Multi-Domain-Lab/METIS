import { MissionModel } from '@server/database/models/missions'
import { ServerMission } from '@server/missions/ServerMission'
import type { ServerUser } from '@server/users/ServerUser'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import { databaseLogger } from '../logging'
import { LaunchSessionError } from './LaunchSessionError'
import { SessionServer } from './SessionServer'

/**
 * Fetches the mission, launches a session for it, and persists the
 * mission's `launchedAt` timestamp.
 * @param missionId The ID of the mission to launch a session for.
 * @param config The configuration for the session.
 * @param owner The user launching the session.
 * @returns The newly launched session.
 * @throws {LaunchSessionError} If the mission is not found or the config is
 * invalid. Callers should map its `reason` to their own error type and
 * treat any other thrown error as a server fault.
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
    throw new LaunchSessionError(
      'mission-not-found',
      `Mission with ID "${missionId}" not found.`,
    )
  }

  // Create mission and launch the session.
  let mission = ServerMission.fromSaveJson(missionDoc.toJSON())

  // Validate the config and throw and error if the validation
  // fails.
  let configProblem = MissionSession.validateConfig(config, mission, {
    requireComplete: true,
  })
  if (configProblem) {
    throw new LaunchSessionError('invalid-config', configProblem)
  }

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
