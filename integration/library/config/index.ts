import fs from 'fs'
import { MetisServer } from '../../../server/MetisServer'
import { ServerTargetEnvironment } from '../../../server/target-environments/ServerTargetEnvironment'
/**
 * @returns Environment variables for the current target
 * environment.
 */
export function loadConfig() {
  try {
    let environment = ServerTargetEnvironment.getCallerTargetEnv()
    let { _id } = environment
    let config: Record<string, string> = {}
    let data = fs.readFileSync(MetisServer.ENVIRONMENT_FILE_PATH, 'utf-8')

    if (data === undefined) {
      throw new Error(`Environment variable METIS_ENV_JSON is not defined.`)
    }

    let allEnvironments = JSON.parse(data)

    if (allEnvironments[_id] === undefined) {
      throw new Error(
        `No configuration found for target environment with ID '${_id}'.`,
      )
    }

    config = allEnvironments[_id]

    return config
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Environment variable METIS_ENV_JSON contains invalid JSON: ${error.message}`,
      )
    } else {
      throw error
    }
  }
}
