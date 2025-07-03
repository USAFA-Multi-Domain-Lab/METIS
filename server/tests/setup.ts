import { expect } from 'chai'
import { before } from 'mocha'
import MissionModel from '../database/models/missions'
import { testLogger } from '../logging/index'
import ServerMission from '../missions'
import MissionImport from '../missions/imports'
import { userCredentials } from './data'
import { agent } from './index.test'
import { testServer } from './server'

export let missionToLaunch: ServerMission

/**
 * Seeds the database with test data before
 * the tests are run.
 * @resolves When the database is seeded.
 * @rejects If there is an error seeding the database.
 */
async function seedDatabase(): Promise<void> {
  // Create a test mission in the database.
  let missionImport = new MissionImport({
    originalName: 'Space ISR Operations (MSS 251).metis',
    path: './tests/static/seeding/Space ISR Operations (MSS 251).metis',
  })
  await missionImport.execute()
  expect(missionImport.results.successfulImportCount).to.equal(1)

  // Retrieve the mission.
  let missionDoc = await MissionModel.findOne({
    name: 'Space ISR Operations (MSS 251)',
  }).exec()
  expect(missionDoc).to.not.equal(null)

  // Create a new mission object and store it
  // in the `missionToLaunch` variable.
  missionToLaunch = ServerMission.fromSaveJson(missionDoc!.toJSON())
}

/**
 * Sets up the test environment by starting the test server and creating a session with a user.
 */
export default function Setup(): void {
  return before(async function () {
    try {
      // Checks to make sure the correct database is being used
      if (testServer.mongoDB !== 'metis-test') {
        throw new Error(
          'Database is not using "metis-test." Please make sure the test database is running.',
        )
      }

      // Starts the test server
      await testServer.serve()
      // Seed the database with test data.
      await seedDatabase()
      // Creates a session with a user because
      // certain API routes require authentication
      // for access
      let response = await agent.post('/api/v1/logins/').send(userCredentials)
      expect(response).to.have.status(200)
    } catch (error: any) {
      if (
        error.message ===
        'Database is not using "metis-test." Please make sure the test database is running.'
      ) {
        testLogger.error(error)
        process.exit(1)
      } else {
        testLogger.error(error)
        throw error
      }
    }
  })
}
