import { StatusError } from '@server/api/v1/library/StatusError'
import { MissionModel } from '@server/database/models/missions'
import { databaseLogger } from '@server/logging'
import { ServerMission } from '@server/missions/ServerMission'
import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import { ApiResponse } from '../../../library/ApiResponse'

/**
 * This will run a migration script on the effect
 * arguments passed.
 * @param request The express request.
 * @param response The express response.
 */
export const migrateEffectArgs: TExpressHandler = async (request, response) => {
  // Extract the necessary data from the request.
  let body = request.body
  let { targetId, environmentId, effectEnvVersion, effectArgs, missionId } =
    body
  let resultingVersion: string = effectEnvVersion
  let mission: ServerMission | null = null

  // Get the target from the registry.
  let target = ServerTargetEnvironment.REGISTRY.getTarget(
    targetId,
    environmentId,
  )
  if (!target) return ApiResponse.sendStatus(response, 404)

  // Attempt to find the associated mission.
  try {
    let missionDoc = await MissionModel.findById(missionId).exec()
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    mission = ServerMission.fromSaveJson(missionDoc.toJSON())
  } catch (error: any) {
    databaseLogger.error(
      `Failed to retrieve mission with ID "${missionId}".\n`,
      error,
    )
    return ApiResponse.error(error, response)
  }

  let pendingMigrationVersions =
    target.getPendingMigrationVersions(effectEnvVersion)

  for (let version of pendingMigrationVersions) {
    target.migrateEffectArgs(version, effectArgs, mission)
    resultingVersion = version
  }

  return ApiResponse.sendJson(response, {
    resultingVersion,
    resultingArgs: effectArgs,
  })
}
