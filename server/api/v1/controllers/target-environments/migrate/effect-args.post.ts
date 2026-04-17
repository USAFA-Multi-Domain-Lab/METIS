import { StatusError } from '@server/api/v1/library/StatusError'
import { MissionModel } from '@server/database/models/missions'
import { databaseLogger } from '@server/logging'
import { ServerMission } from '@server/missions/ServerMission'
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
  let { effectId, missionId } = body
  let mission: ServerMission | null = null

  // Attempt to find the associated mission.
  try {
    let missionDoc = await MissionModel.findById(missionId).exec()
    if (missionDoc === null) {
      throw new StatusError(`Mission with ID "${missionId}" not found.`, 404)
    }
    mission = ServerMission.fromSaveJson(missionDoc.toJSON())
  } catch (error: any) {
    databaseLogger.error(
      `Failed to retrieve effect/mission data with mission "${missionId}".\n`,
      error,
    )
    return ApiResponse.error(error, response)
  }

  // Get effect and target.
  let effect = mission.allEffects.find(({ _id }) => _id === effectId)
  if (!effect) return ApiResponse.sendStatus(response, 404)
  let target = effect.target
  if (!target) return ApiResponse.sendStatus(response, 404)
  let migratableEffect = effect.toMigratable()

  target.migrateEffect(migratableEffect)

  return ApiResponse.sendJson(response, {
    result: migratableEffect.result,
  })
}
