import { expect } from 'chai'
import { testLogger } from '../../logging'
import {
  correctUpdateTestMission,
  createMissionWithNoForceData,
  testMission,
  updateMissionWithNoForceData,
  updateMissionWithNoMissionId,
  updateMissionWithNoNodeStructure,
} from '../data'
import { agent, permittedUserAccess } from '../index.test'

/**
 * Tests for each mission route on the API.
 */
export default function MissionApiRoutes(): Mocha.Suite {
  return describe('API Mission Routes', function () {
    // Stores all the missions that were in
    // the database before the tests were run
    let createdMissionIdArray: string[] = []
    // A mission's ID that will be used throughout this test suite.
    let missionId: string = ''

    it('User should be logged in as an admin to be able to post missions to the database via the API', async function () {
      try {
        let response = await agent.get('/api/v1/logins/')

        expect(response.body.user.accessId).to.equal(permittedUserAccess)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Calling the missions route without any params should return a successful (200) response', async function () {
      try {
        let response = await agent.get(`/api/v1/missions`)
        // Set the missionId to the first mission in the database.
        missionId = response.body[0]._id

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending the wrong query is ignored and a successful (200) response should be returned', async function () {
      try {
        let response = await agent.get(`/api/v1/missions`).query({
          wrongQueryProperty: 'alsdkfdskjfsl',
        })

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Getting a mission where the "_id" is not of type "objectId" in the query of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent.get(`/api/v1/missions/${2}`)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Getting a mission with all the correct properties in the params of the request should result in a successful (200) response', async function () {
      try {
        let response = await agent.get(`/api/v1/missions/${missionId}`)

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Getting the environment should return a successful (200) response', async function () {
      try {
        let response = await agent.get(`/api/v1/missions/environment/`)

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Creating a mission with (a) missing property/properties in the body of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/')
          .set('Content-Type', 'application/json')
          .send(createMissionWithNoForceData)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Creating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
      try {
        let response = await agent
          .post('/api/v1/missions/')
          .set('Content-Type', 'application/json')
          .send(testMission)

        expect(response).to.have.status(200)
        createdMissionIdArray.push(response.body._id)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission with (a) missing property/properties that is required (_id) in the body of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent
          .put('/api/v1/missions/')
          .set('Content-Type', 'application/json')
          .send(updateMissionWithNoMissionId)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission where the nodeStructure is defined, but the nodeData is undefined in the body of the request should return an internal server error (500) response', async function () {
      missionId = createdMissionIdArray[0]
      updateMissionWithNoForceData._id = missionId

      try {
        let response = await agent
          .put('/api/v1/missions/')
          .set('Content-Type', 'application/json')
          .send(updateMissionWithNoForceData)

        expect(response).to.have.status(500)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission where the nodeData is defined, but the nodeStructure is undefined in the body of the request should return an internal server error (500) response', async function () {
      missionId = createdMissionIdArray[0]
      updateMissionWithNoNodeStructure._id = missionId

      try {
        let response = await agent
          .put('/api/v1/missions/')
          .set('Content-Type', 'application/json')
          .send(updateMissionWithNoNodeStructure)

        expect(response).to.have.status(500)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
      missionId = createdMissionIdArray[0]
      correctUpdateTestMission._id = missionId

      try {
        let response = await agent
          .put('/api/v1/missions/')
          .set('Content-Type', 'application/json')
          .send(correctUpdateTestMission)

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Copying a mission with (a) missing property/properties in the body of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent
          .put('/api/v1/missions/copy/')
          .set('Content-Type', 'application/json')
          .send({ copyName: 'Copied Mission' })

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Copying a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
      missionId = createdMissionIdArray[0]

      try {
        let response = await agent
          .put('/api/v1/missions/copy/')
          .set('Content-Type', 'application/json')
          .send({ copyName: 'Copied Mission', originalId: missionId })

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Deleting a mission with the wrong type for the "_id" in the params of the request should return a bad request (400) response', async function () {
      try {
        let response = await agent.delete(`/api/v1/missions/${2}`)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Deleting a mission with all the correct properties in the params of the request should return a successful (200) response', async function () {
      missionId = createdMissionIdArray[0]

      try {
        let response = await agent.delete(`/api/v1/missions/${missionId}`)

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
