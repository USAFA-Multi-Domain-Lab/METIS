import MissionApiRoute from './api-route'
import MetisFiles from './metis-files'
import MissionSchema from './schema'

/**
 * Executes all the tests for the missions.
 */
export default function Missions(): void {
  MetisFiles()
  MissionApiRoute()
  MissionSchema()
}
