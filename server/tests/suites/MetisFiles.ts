import { expect } from 'chai'
import { testLogger } from '../../logging'
import { agent, permittedUserAccess } from '../index.test'

/**
 * Tests for the export/import mission feature.
 */
export default function MetisFiles(): Mocha.Suite {
  return describe('Export/Import File Tests', function () {
    // A mission's ID that will be used throughout this test suite.
    let missionId: string = ''

    it('The missionId should be set to the ID of the first mission in the database', async function () {
      try {
        let response = await agent.get(`/api/v1/missions`)
        // Set the missionId to the first mission in the database.
        missionId = response.body[0]._id

        expect(missionId).to.not.equal('')
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the missions route on the API should return a successful (200) response', async function () {
      try {
        let response = await agent.get('/api/v1/missions/')
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('User should be logged in as an admin to access the import and/or export API', async function () {
      try {
        let response = await agent.get('/api/v1/logins/')
        expect(response.body.user.accessId).to.equal(permittedUserAccess)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the export route with the correct name and "_id" should return a successful (200) response', async function () {
      try {
        let response = await agent.get(`/api/v1/missions/${missionId}/export/`)
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the export route on the API without a "_id" as a query should return a bad request (400) response', async function () {
      try {
        let response = await agent.get(`/api/v1/missions/''/export/`)
        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the export route on the API with a "_id" that does not exist should return a not found (404) response', async function () {
      try {
        let response = await agent.get(
          `/api/v1/missions/65328d4c978db2d9540048eb/export/`,
        )
        expect(response).to.have.status(404)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a valid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Valid Mission.cesar')
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with an invalid file should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Invalid Mission.cesar')
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Attack Mission.jpeg')
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a file that has a "schemaBuildNumber" missing should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/No schemaBuildNumber Mission.cesar')
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a file that has a syntax error should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Syntax Error Mission.cesar')
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a file that has an extra invalid property in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach(
            'files',
            './tests/static/Extra Invalid Property Mission.cesar',
          )
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a file that has extra data in the node data should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Extra Data Mission.cesar')
        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a multiple valid files should have a "successfulImportCount" set to 2, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Valid Mission.cesar')
          .attach('files', './tests/static/Valid Mission(1).cesar')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(2)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with one valid file and one invalid file should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Valid Mission.cesar')
          .attach('files', './tests/static/Invalid Mission.cesar')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead) should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/bolt-solid.cesar')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".cesar" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Schema Build 4.cesar')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Schema Build 4.metis')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 0, and an array called "failedImportErrorMessages" with a length of 0', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Schema Build 10.metis')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(0)
        expect(response.body.failedImportErrorMessages.length).to.equal(0)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".cesar" extension should have a "successfulImportCount" set to 0, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Schema Build 10.cesar')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(0)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension and a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 1, and an array called "failedImportErrorMessages" with a length of 1', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Schema Build 10.metis')
          .attach('files', './tests/static/Schema Build 4.metis')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(1)
        expect(response.body.failedImportErrorMessages.length).to.equal(1)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the import route on the API with a valid file that has a "schemaBuildNumber" of 10 or greater and a ".metis" extension, a valid file that has a "schemaBuildNumber" of 9 or less and a ".metis" extension, a file that has an invalid extension (i.e., should be a .svg, .png, .pdf, etc. and is a .cesar instead), and a file that has valid contents, but an invalid extension should have a "successfulImportCount" set to 1, "failedImportCount" set to 3, and an array called "failedImportErrorMessages" with a length of 3', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/import/')
          .attach('files', './tests/static/Schema Build 10.metis')
          .attach('files', './tests/static/Schema Build 4.metis')
          .attach('files', './tests/static/bolt-solid.cesar')
          .attach('files', './tests/static/Attack Mission.jpeg')

        expect(response).to.have.status(200)
        expect(response.body.successfulImportCount).to.equal(1)
        expect(response.body.failedImportCount).to.equal(3)
        expect(response.body.failedImportErrorMessages.length).to.equal(3)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
