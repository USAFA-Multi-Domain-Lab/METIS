import { expect } from 'chai'
import { testLogger } from 'metis/server/logging'
import ServerUser from 'metis/server/users'
import {
  correctUpdateTestMission,
  createMissionWithNoForceData,
  testMission,
  updateMissionWithNoForceData,
  updateMissionWithNoMissionId,
  updateMissionWithNoStructure,
} from '../../data'
import { agent } from '../../index.test'

/**
 * Tests each of the API route endpoints that are used to access the mission data on the server.
 */
export default function MissionApiRoute(): Mocha.Suite {
  return describe('API Mission Route', function () {
    // Stores all the missions that were in the database before the
    // tests started.
    let createdMissionIdArray: string[] = []
    // A mission's ID that will be used throughout this test suite.
    let missionId: string = ''

    it('The user should have the correct permission(s) to use the API route for missions', async function () {
      try {
        let response = await agent.get('/api/v1/logins/')
        let user = new ServerUser(response.body.user)
        let hasCorrectPermissions: boolean = user.isAuthorized([
          'missions_write',
          'missions_read',
        ])

        expect(hasCorrectPermissions).to.equal(true)
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
          .send(createMissionWithNoForceData)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Creating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
      try {
        let response = await agent.post('/api/v1/missions/').send(testMission)

        expect(response).to.have.status(200)
        createdMissionIdArray.push(response.body._id)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it("Updating a mission without the mission's ID in the body of the request should return a bad request (400) response", async function () {
      try {
        let response = await agent
          .put('/api/v1/missions/')
          .send(updateMissionWithNoMissionId)

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission where the structure is defined, but the force data is undefined in the body of the request should return a successful (200) response', async function () {
      missionId = createdMissionIdArray[0]
      updateMissionWithNoForceData._id = missionId

      try {
        let getResponse = await agent.get(`/api/v1/missions/${missionId}`)
        let mission = getResponse.body
        updateMissionWithNoForceData.structure = mission.structure
        updateMissionWithNoForceData.prototypes = mission.prototypes

        let response = await agent
          .put('/api/v1/missions/')
          .send(updateMissionWithNoForceData)

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission where the force data is defined, but the structure is undefined in the body of the request should return a successful (200) response', async function () {
      missionId = createdMissionIdArray[0]
      updateMissionWithNoStructure._id = missionId

      try {
        let response = await agent
          .put('/api/v1/missions/')
          .send(updateMissionWithNoStructure)

        expect(response).to.have.status(200)
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
