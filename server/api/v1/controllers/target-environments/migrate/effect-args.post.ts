import type { Request, Response } from 'express-serve-static-core'
import type { TAnyObject } from 'metis/toolbox'
import { ServerTargetEnvironment } from '../../../../../target-environments'
import { ApiResponse } from '../../../library/ApiResponse'

/**
 * This will run a migration script on the effect
 * arguments passed.
 * @param request The express request.
 * @param response The express response.
 */
const migrateEffectArgs = async (request: Request, response: Response) => {
  // Extract the necessary data from the request.
  let body = request.body
  let { targetId, environmentId, effectEnvVersion, effectArgs } = body
  let resultingArgs: TAnyObject = effectArgs
  let resultingVersion: string = effectEnvVersion

  // Get the target from the registry.
  let target = ServerTargetEnvironment.REGISTRY.getTarget(
    targetId,
    environmentId,
  )
  if (!target) return ApiResponse.sendStatus(response, 404)

  let pendingMigrationVersions =
    target.getPendingMigrationVersions(effectEnvVersion)

  for (let version of pendingMigrationVersions) {
    resultingArgs = target.migrateEffectArgs(version, effectArgs)
    resultingVersion = version
  }

  return ApiResponse.sendJson(response, { resultingVersion, resultingArgs })

  // try {
  //   // Retrieve the original mission.
  //   let originalMissionDoc = await MissionModel.findById(originalId).exec()
  //   // If the original mission is not found, throw an error.
  //   if (originalMissionDoc === null) {
  //     throw new StatusError(
  //       `Original mission with ID "${originalId}" not found.`,
  //       404,
  //     )
  //   }
  //   // Create the copy of the mission.
  //   let copiedMissionDoc = await MissionModel.create({
  //     name: copyName,
  //     versionNumber: originalMissionDoc.versionNumber,
  //     structure: originalMissionDoc.structure,
  //     forces: originalMissionDoc.forces,
  //     prototypes: originalMissionDoc.prototypes,
  //     files: originalMissionDoc.files,
  //   })
  //   // Extract the necessary data from the copy.
  //   let { _id, name, versionNumber, seed } = copiedMissionDoc
  //   // Return a successful API response.
  //   return ApiResponse.sendJson(response, { _id, name, versionNumber, seed })
  // } catch (error: any) {
  //   // Log the error.
  //   databaseLogger.error(
  //     `Failed to copy mission { originalId: "${originalId}", copyName: "${copyName}" }.\n`,
  //     error,
  //   )
  //   // Handle the error.
  //   return ApiResponse.error(error, response)
  // }
}

export default migrateEffectArgs
