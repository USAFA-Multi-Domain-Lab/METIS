import { expect } from 'chai'
import { TCommonMissionJson } from 'metis/missions'
import { testLogger } from 'metis/server/logging'
import ServerUser from 'metis/server/users'
import mongoose from 'mongoose'
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
        let missions = await agent.get(`/api/v1/missions`)
        let response = await agent.get(
          `/api/v1/missions/${missions.body[0]._id}`,
        )
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
        let { _id, name, seed, structure, versionNumber, prototypes, forces } =
          response.body as TCommonMissionJson

        // Check to see if the _id is valid.
        let isValidId: boolean =
          mongoose.isObjectIdOrHexString(_id) && typeof _id === 'string'

        expect(response).to.have.status(200)
        expect(isValidId).to.equal(true)
        expect(name).to.equal(testMission.name)
        expect(versionNumber).to.equal(testMission.versionNumber)
        expect(seed).to.equal(testMission.seed)
        expect(structure).to.deep.equal(testMission.structure)
        expect(prototypes).to.deep.equal(testMission.prototypes)
        expect(forces).to.deep.equal(testMission.forces)
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
      try {
        // Create a mission to update.
        let { body: currentMission } = await agent
          .post('/api/v1/missions/')
          .send(testMission)
        // Use the current mission's ID to update the mission.
        updateMissionWithNoForceData._id = currentMission._id

        let response = await agent
          .put('/api/v1/missions/')
          .send(updateMissionWithNoForceData)

        let { _id, name, seed, structure, versionNumber, prototypes, forces } =
          response.body as TCommonMissionJson

        // Check to see if the _id is valid.
        let isValidId: boolean =
          mongoose.isObjectIdOrHexString(_id) && typeof _id === 'string'

        expect(response).to.have.status(200)
        expect(isValidId).to.equal(true)
        expect(name).to.equal(updateMissionWithNoForceData.name)
        expect(versionNumber).to.equal(
          updateMissionWithNoForceData.versionNumber,
        )
        expect(seed).to.equal(updateMissionWithNoForceData.seed)
        expect(structure).to.deep.equal(updateMissionWithNoForceData.structure)
        expect(prototypes).to.deep.equal(
          updateMissionWithNoForceData.prototypes,
        )
        expect(forces).to.deep.equal(currentMission.forces)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission where the force data is defined, but the structure is undefined in the body of the request should return a successful (200) response', async function () {
      try {
        // Create a mission to update.
        let { body: currentMission } = await agent
          .post('/api/v1/missions/')
          .send(testMission)
        // Use the current mission's ID to update the mission.
        updateMissionWithNoStructure._id = currentMission._id

        let response = await agent
          .put('/api/v1/missions/')
          .send(updateMissionWithNoStructure)
        let { _id, name, seed, structure, versionNumber, prototypes, forces } =
          response.body as TCommonMissionJson

        // Check to see if the _id is valid.
        let isValidId: boolean =
          mongoose.isObjectIdOrHexString(_id) && typeof _id === 'string'

        // Check all the properties of the mission.
        expect(response).to.have.status(200)
        expect(isValidId).to.equal(true)
        expect(name).to.equal(updateMissionWithNoStructure.name)
        expect(versionNumber).to.equal(
          updateMissionWithNoStructure.versionNumber,
        )
        expect(seed).to.equal(updateMissionWithNoStructure.seed)
        expect(structure).to.deep.equal(currentMission.structure)
        expect(prototypes).to.deep.equal(
          updateMissionWithNoStructure.prototypes,
        )
        expect(forces).to.deep.equal(updateMissionWithNoStructure.forces)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Updating a mission with all the correct properties in the body of the request should return a successful (200) response', async function () {
      try {
        // Create a mission to update.
        let { body: currentMission } = await agent
          .post('/api/v1/missions/')
          .send(testMission)
        // Use the current mission's ID to update the mission.
        correctUpdateTestMission._id = currentMission._id

        let response = await agent
          .put('/api/v1/missions/')
          .send(correctUpdateTestMission)
        let { _id, name, seed, structure, versionNumber, prototypes, forces } =
          response.body as TCommonMissionJson

        // Check to see if the _id is valid.
        let isValidId: boolean =
          mongoose.isObjectIdOrHexString(_id) && typeof _id === 'string'

        // Check all the properties of the mission.
        expect(response).to.have.status(200)
        expect(isValidId).to.equal(true)
        expect(name).to.equal(correctUpdateTestMission.name)
        expect(versionNumber).to.equal(correctUpdateTestMission.versionNumber)
        expect(seed).to.equal(correctUpdateTestMission.seed)
        expect(structure).to.deep.equal(correctUpdateTestMission.structure)
        expect(prototypes).to.deep.equal(correctUpdateTestMission.prototypes)
        expect(forces).to.deep.equal(correctUpdateTestMission.forces)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it("Updating a mission with all the correct properties in the body of the request should return a mission with the same '_id' as the one in the body of the request", async function () {
      try {
        // Create a mission to update.
        let { body: currentMission } = await agent
          .post('/api/v1/missions/')
          .send(testMission)
        // Use the current mission's ID to update the mission.
        correctUpdateTestMission._id = currentMission._id
        // Update the mission.
        let response = await agent
          .put('/api/v1/missions/')
          .send(correctUpdateTestMission)
        // Check to see if the _id is the same as the one in the body of the request.
        expect(response.body._id).to.equal(correctUpdateTestMission._id)
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
      try {
        // Create a mission to copy.
        let { body: currentMission } = await agent
          .post('/api/v1/missions/')
          .send(testMission)
        // Copy the mission.
        let response = await agent
          .put('/api/v1/missions/copy/')
          .send({ copyName: 'Copied Mission', originalId: currentMission._id })
        // Check to see if the response is successful.
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
      try {
        // Create a mission to delete.
        let { body: currentMission } = await agent
          .post('/api/v1/missions/')
          .send(testMission)

        // Delete the mission.
        let response = await agent.delete(
          `/api/v1/missions/${currentMission._id}`,
        )
        // Check to see if the response is successful.
        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
