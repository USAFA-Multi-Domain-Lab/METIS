import { expect } from 'chai'
import { TMissionJson } from 'metis/missions'
import { testLogger } from 'metis/server/logging'
import MissionModel from '../../../database/models/missions'
import { testMission } from '../../data'

/**
 * Tests the mission schema validation functions that are used to validate data that
 * is trying to be sent to the database.
 */
export default function MissionSchema(): Mocha.Suite {
  return describe('Mission Schema Validation', function () {
    // A mission's ID that will be used throughout this test suite.
    let missionId: string = ''

    it('Creating a mission with all the correct properties should save the mission to the database', async function () {
      try {
        // Save the mission to the database.
        let savedMissionDoc = await MissionModel.create(testMission)
        // Convert the mission document to JSON.
        let savedMissionJson = savedMissionDoc.toJSON()
        // Grab the "id" that is auto-generated
        // to use for the next test.
        missionId = savedMissionDoc.id
        // The retrieved mission should have the same
        // name as the test mission.
        expect(savedMissionJson.name).to.equal(testMission.name)
        // The retrieved mission should have the same
        // versionNumber as the test mission.
        expect(savedMissionJson.versionNumber).to.equal(
          testMission.versionNumber,
        )
        // The retrieved mission's seed property should
        // be the same as the test mission's seed property.
        expect(savedMissionJson.seed).to.equal(testMission.seed)
        // The retrieved mission should have the same
        // structure as the test mission.
        expect(savedMissionJson.structure).to.deep.equal(testMission.structure)
        // The retrieved mission should have the same
        // forces as the test mission.
        expect(savedMissionJson.forces).to.deep.equal(testMission.forces)
      } catch (error: any) {
        // Logs the error.
        testLogger.error(error)
        // Ends the test with the error thrown.
        throw error
      }
    })

    it('Querying for the newly created mission should return the correct mission', async function () {
      try {
        // Query for the mission with the "_id"
        // set from the previous test
        let retrievedMissionJson: TMissionJson | null =
          await MissionModel.findById(missionId).lean().exec()
        // The retrieved mission should have the same
        // name as the test mission
        expect(retrievedMissionJson?.name).to.equal(testMission.name)
        // The retrieved mission should have the same
        // versionNumber as the test mission
        expect(retrievedMissionJson?.versionNumber).to.equal(
          testMission.versionNumber,
        )
        // The retrieved mission's seed property should
        // be the same as the test mission's seed property.
        expect(retrievedMissionJson?.seed).to.equal(testMission.seed)
        // The retrieved mission should have the same
        // structure as the test mission
        expect(retrievedMissionJson?.structure).to.deep.equal(
          testMission.structure,
        )
        // The retrieved mission should have the same
        // forces as the test mission
        expect(retrievedMissionJson?.forces).to.deep.equal(testMission.forces)
      } catch (error: any) {
        // Logs the error
        testLogger.error(error)
        // Ends the test with the error thrown
        throw error
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#fffffg") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#fffffg'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#fffffg`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("ffffff") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = 'ffffff'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `ffffff`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#fffffff") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#fffffff'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#fffffff`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("white") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = 'white'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `white`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#white") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#white'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#white`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("asfjsdjkf #ffffff sadlkfsld") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = 'asfjsdjkf #ffffff sadlkfsld'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `asfjsdjkf #ffffff sadlkfsld`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("asfjsdjkf#ffffffsadlkfsld") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = 'asfjsdjkf#ffffffsadlkfsld'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `asfjsdjkf#ffffffsadlkfsld`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#6545169") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#6545169'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#6545169`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#abcdef99") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#abcdef99'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#abcdef99`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("abcdef") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = 'abcdef'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `abcdef`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("fff") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = 'fff'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `fff`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#fff") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#fff'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#fff`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#*&@^%!") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#*&@^%!'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#*&@^%!`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#+89496") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#+89496'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#+89496`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#89a96+") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#89a96+'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#89a96+`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#8996+") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#8996+'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#8996+`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is not a valid hex color code ("#896+") should result in a validation error', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#896+'

      try {
        await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
      } catch (error: any) {
        // Check to make sure there was an error
        expect(error).to.not.equal(null)
        // The error should be a validation error
        expect(error.name).to.equal('ValidationError')
        // The error message should be a validation error
        expect(error.message).to.equal(
          'Mission validation failed: forces.0.color: Validator failed for path `color` with value `#896+`',
        )
      }
    })

    it('Creating a mission with a force that has a color that is a valid hex color code ("#acde58") should result in a successful (200) response', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the color of the first force to an invalid hex color code
      forces[0].color = '#acde58'

      try {
        // Create a new mission.
        let missionDoc = await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
        // Convert the mission document to JSON
        let missionJson = missionDoc.toJSON()
        expect(missionJson.forces[0].color).to.equal('#acde58')
      } catch (error: any) {
        // Logs the error
        testLogger.error(error)
        // Ends the test with the error thrown
        throw error
      }
    })

    it('Creating a mission with HTMl tags that are not allowed ("<script></script>") in the mission should result in those tags being removed from the mission', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the introMessage of the first force to a string with a "script" tag
      forces[0].introMessage =
        "<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><script>function consoleLog() {console.log('Successful script execution.')} consoleLog()</script>"
      // Set the preExecutionText of the first node in the first force to a string with an improper "p" tag
      forces[0].nodes[0].preExecutionText =
        "<p>Node has not been executed.</p><p href='https://google.com>Google</p>'"

      try {
        // Create a new mission
        let missionDoc = await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
        // Convert the mission document to JSON
        let missionJson = missionDoc.toJSON()
        // The introMessage of the mission should be the same as what was set above
        expect(missionJson.forces[0].introMessage).to.equal(
          '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
        )
        // The preExecutionText of the first force should be the same as what was set above
        expect(missionJson.forces[0].nodes[0].preExecutionText).to.equal(
          '<p>Node has not been executed.</p>',
        )
      } catch (error: any) {
        // Logs the error
        testLogger.error(error)
        // Ends the test with the error thrown
        throw error
      }
    })

    it('Creating a mission with HTMl tags that are not allowed ("<style></style>") in the mission should result in those tags being removed from the mission', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the introMessage of the mission's first force to a string with a "style" tag
      forces[0].introMessage =
        "<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><style>.Content {font-size: 25px;}</style>"

      try {
        // Create a new mission.
        let missionDoc = await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
        // Convert the mission document to JSON
        let missionJson = missionDoc.toJSON()
        // The introMessage of the mission should be the same as what was set above
        expect(missionJson.forces[0].introMessage).to.equal(
          '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
        )
      } catch (error: any) {
        // Logs the error
        testLogger.error(error)
        // Ends the test with the error thrown
        throw error
      }
    })

    it('Creating a mission with HTMl tags that are not allowed ("<iframe></iframe>") in the mission should result in those tags being removed from the mission', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the introMessage of the mission's first force to a string with an "iframe" tag
      forces[0].introMessage = `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13026964.31028058!2d-106.25408262379291!3d37.1429207037123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab584e432360b%3A0x1c3bb99243deb742!2sUnited%20States!5e0!3m2!1sen!2sus!4v1695930378392!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`

      try {
        // Create a new mission.
        let missionDoc = await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
        // Convert the mission document to JSON
        let missionJson = missionDoc.toJSON()
        // The introMessage of the mission should be the same as what was set above
        expect(missionJson.forces[0].introMessage).to.equal(
          '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
        )
      } catch (error: any) {
        // Logs the error
        testLogger.error(error)
        // Ends the test with the error thrown
        throw error
      }
    })

    it('Creating a mission with HTMl tags that are not allowed ("<input />") in the mission should result in those tags being removed from the mission', async function () {
      // Grab the mission data
      let { name, versionNumber, structure, forces, prototypes } = testMission
      // Set the introMessage of the mission's first force to a string with an "input" tag
      forces[0].introMessage = `<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a href='https://google.com' rel='noopener noreferrer' target='_blank'>message</a> here.</p><input type="text" id="fname" name="fname" value="John">`

      try {
        // Create a new mission.
        let missionDoc = await MissionModel.create({
          name,
          versionNumber,
          structure,
          forces,
          prototypes,
        })
        // Convert the mission document to JSON
        let missionJson = missionDoc.toJSON()
        // The introMessage of the mission should be the same as what was set above
        expect(missionJson.forces[0].introMessage).to.equal(
          '<p><strong>Enter</strong> <em>your</em> <u>overview</u> <a target="_blank" rel="noopener noreferrer" href="https://google.com">message</a> here.</p>',
        )
      } catch (error: any) {
        // Logs the error
        testLogger.error(error)
        // Ends the test with the error thrown
        throw error
      }
    })
  })
}
