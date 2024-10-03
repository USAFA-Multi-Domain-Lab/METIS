import { Router } from 'express'
import { Request, Response } from 'express-serve-static-core'
import fs from 'fs'
import { TCommonMissionJson } from 'metis/missions'
import MetisServer from 'metis/server'
import MetisDatabase from 'metis/server/database'
import { filterErrors_findOne } from 'metis/server/database/api-call-handlers'
import InfoModel from 'metis/server/database/models/info'
import MissionModel from 'metis/server/database/models/missions'
import { TMetisRouterMap } from 'metis/server/http/router'
import { databaseLogger } from 'metis/server/logging'
import mongoose from 'mongoose'
import path from 'path'
import { v4 as generateHash } from 'uuid'
import { RequestBodyFilters, defineRequests } from '../../middleware/requests'
import uploads from '../../middleware/uploads'
import { auth } from '../../middleware/users'

type MulterFile = Express.Multer.File

export const routerMap: TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => {
  /* ---------------------------- CREATE ---------------------------- */

  /**
   * Creates a new mission.
   * @returns The new mission.
   */
  const createMission = (request: Request, response: Response) => {
    let { name, versionNumber, nodeStructure, forces } =
      request.body as TCommonMissionJson

    let mission = new MissionModel({
      name,
      versionNumber,
      nodeStructure,
      forces,
    })

    mission.save((error: Error) => {
      if (error) {
        databaseLogger.error('Failed to create mission:')
        databaseLogger.error(error)

        if (
          error.name === MetisDatabase.ERROR_BAD_DATA ||
          error.message.includes('validation failed')
        ) {
          return response.sendStatus(400)
        } else {
          return response.sendStatus(500)
        }
      } else {
        databaseLogger.info(`New mission created named "${name}".`)

        // Retrieves newly created mission
        // to return in response. This is
        // called again, one to call the
        // queryForApiResponse function,
        // and two, to ensure what's returned
        // is what is in the database.
        MissionModel.findOne({ _id: mission._id })
          .queryForApiResponse('findOne')
          .exec((error: Error, mission: any) => {
            // If something goes wrong, this is
            // a server issue. If there was something
            // the client did, an error would have
            // already been thrown in the first query.
            if (error || !mission) {
              databaseLogger.error('Failed to retrieve newly created mission')
              databaseLogger.error(error)
              return response.sendStatus(500)
            } else {
              // Return updated mission to the user.
              return response.send(mission)
            }
          })
      }
    })
  }

  /**
   * This will import a mission from a file.
   */
  const importMission = (request: Request, response: Response) => {
    // Verifies files were included
    // in the request.
    if (
      request.files &&
      request.files instanceof Array &&
      request.files.length > 0
    ) {
      let fileProcessCount: number = 0
      let successfulImportCount: number = 0
      let failedImportCount: number = 0
      let failedImportErrorMessages: Array<{
        fileName: string
        errorMessage: string
      }> = []

      // This is called when an error occurs
      // while creating the mission.
      const handleMissionImportError = (
        file: MulterFile,
        error: Error,
      ): void => {
        databaseLogger.error('Failed to import mission:')
        databaseLogger.error(error)

        let fileName: string = file.originalname
        let errorMessage: string = error.message

        while (errorMessage.includes('`')) {
          errorMessage = errorMessage.replace('`', '*')
        }

        failedImportErrorMessages.push({
          fileName,
          errorMessage,
        })

        failedImportCount++
        fileProcessCount++
      }

      // This is called to handle any
      // necessary migrations if the upload
      // is marked with a previous schema
      // build.
      const migrateIfOutdated = (missionData: any, file: MulterFile): void => {
        let schemaBuildNumber: number = missionData.schemaBuildNumber

        // If schema build number was not
        // included in JSON, an error is
        // thrown.
        if (!schemaBuildNumber) {
          let error: Error = new Error('No schema build number found.')
          handleMissionImportError(file, error)
        }

        // -- BUILD 5 --
        // This migration script is responsible
        // for adding the description property
        // to the node level of the missions
        // collection.

        if (schemaBuildNumber < 5) {
          let nodeData = missionData.nodeData

          for (let nodeDatum of nodeData) {
            if (!('description' in nodeDatum)) {
              nodeDatum.description = 'Description not set...'
            }
          }
        }

        // -- BUILD 9
        // This migration script is responsible
        // for adding the scripts property
        // to the action level of the missions
        // collection.

        if (schemaBuildNumber < 9) {
          let nodeData = missionData.nodeData

          for (let nodeDatum of nodeData) {
            let actions: any[] = nodeDatum.actions

            for (let action of actions) {
              if (!('scripts' in action)) {
                action.scripts = []
              }
            }
          }
        }

        // -- BUILD 10 --
        // This migration script is responsible
        // for changing the color property's
        // value at the node level of the
        // missions collection to use hexidecimal
        // values.

        if (schemaBuildNumber < 10) {
          let nodeData = missionData.nodeData

          for (let nodeDatum of nodeData) {
            let color = nodeDatum.color

            if (color === 'default') {
              nodeDatum.color = '#ffffff'
            } else if (color === 'green') {
              nodeDatum.color = '#65eb59'
            } else if (color === 'pink') {
              nodeDatum.color = '#fa39ac'
            } else if (color === 'yellow') {
              nodeDatum.color = '#f7e346'
            } else if (color === 'blue') {
              nodeDatum.color = '#34a1fb'
            } else if (color === 'purple') {
              nodeDatum.color = '#ae66d6'
            } else if (color === 'red') {
              nodeDatum.color = '#f9484f'
            } else if (color === 'brown') {
              nodeDatum.color = '#ac8750'
            } else if (color === 'orange') {
              nodeDatum.color = '#ffab50'
            }
          }
        }

        // -- BUILD 11 --
        // This migration script is responsible
        // for adding the introduction message
        // property at the mission level of the
        // missions collection.
        if (schemaBuildNumber < 11) {
          if (!('introMessage' in missionData)) {
            missionData.introMessage = 'Enter your overview message here.'
          }
        }

        // -- BUILD 12 --
        // This migration script is responsible
        // for updating all the properties that
        // are allowed to have rich text to
        // be wrapped in "p" tags.
        if (schemaBuildNumber < 12) {
          missionData.introMessage = `<p>${missionData.introMessage}</p>`

          let nodeData = missionData.nodeData

          for (let nodeDatum of nodeData) {
            nodeDatum.description = `<p>${nodeDatum.description}</p>`
            nodeDatum.preExecutionText = `<p>${nodeDatum.preExecutionText}</p>`

            let actions: any[] = nodeDatum.actions
            for (let action of actions) {
              action.description = `<p>${action.description}</p>`
              action.postExecutionSuccessText = `<p>${action.postExecutionSuccessText}</p>`
              action.postExecutionFailureText = `<p>${action.postExecutionFailureText}</p>`
            }
          }
        }

        // -- BUILD 13 --
        // This migration script is responsible
        // removing default text from existing
        // properties with default text.
        // (i.e. '<p>No description set...</p>',
        // '<p>Description text goes here.</p>')
        if (schemaBuildNumber < 13) {
          let nodeData = missionData.nodeData

          // Loop through nodeData.
          for (let nodeDatum of nodeData) {
            // If the description has default text, set it to an empty string.
            if (
              nodeDatum.description === '<p>No description set...</p>' ||
              nodeDatum.description === '<p>Description text goes here.</p>' ||
              nodeDatum.description === '<p>Description not set...</p>'
            ) {
              nodeDatum.description = '<p><br></p>'
            }

            // If the pre-execution text has default text, set it to an empty string.
            if (
              nodeDatum.preExecutionText ===
                '<p>No pre-execution text set...</p>' ||
              nodeDatum.preExecutionText ===
                '<p>Node has not been executed.</p>'
            ) {
              nodeDatum.preExecutionText = '<p><br></p>'
            }
          }
        }

        // -- BUILD 17 --
        // This migration script is responsible
        // for removing scripts from actions stored
        // in a mission and adding a new property
        // to actions called "effects."
        if (schemaBuildNumber < 17) {
          // Grab the nodeData.
          let nodeData = missionData.nodeData

          // Loop through nodeData.
          for (let nodeDatum of nodeData) {
            // Grab the actions.
            let actions: any[] = nodeDatum.actions

            // Loop through actions.
            for (let action of actions) {
              // If the action doesn't have effects,
              // set it to an empty array.
              if (!('effects' in action)) {
                action.effects = []
              }
              // Remove the scripts from the action.
              delete action.scripts
            }
          }
        }

        // -- BUILD 18 --
        // This migration script is responsible
        // for replacing the actionID of actions
        // generated by build_000003.js with a
        // randomly generated actionID.
        if (schemaBuildNumber < 18) {
          // Grab the nodeData.
          let nodeData = missionData.nodeData

          for (let nodeDatum of nodeData) {
            if (nodeDatum.actions) {
              let actions = nodeDatum.actions

              for (let action of actions) {
                if (action.actionID === 'migration-generated-action') {
                  action.actionID = `${Math.random()
                    .toString(36)
                    .substring(2, 15)}${Math.random()
                    .toString(36)
                    .substring(2, 15)}`
                }
              }
            }
          }
        }

        // -- BUILD 20 --
        // This migration script is responsible
        // for removing the "live" property from
        // all missions and removing the "missionID",
        // "actionID", and "effect.id" properties from
        // all missions, nodes, and actions. It also
        // renames the "nodeID" property to "structureKey"
        // in all nodes.
        if (schemaBuildNumber < 20) {
          let mission = missionData

          // Remove the "live" property from the mission.
          if (mission.live !== undefined) {
            delete mission.live
          }

          // Remove the "missionID" property from the mission.
          if (mission.missionID) {
            delete mission.missionID
          }

          // Grab the nodeData.
          let nodeData = mission.nodeData

          // Loop through nodes.
          for (let nodeDatum of nodeData) {
            // Rename the "nodeID" property to "structureKey".
            if (nodeDatum.nodeID) {
              nodeDatum.structureKey = nodeDatum.nodeID
              delete nodeDatum.nodeID
            }

            // Grab all actions.
            let actions = nodeDatum.actions
            // Loop through actions.
            for (let action of actions) {
              // Remove the "actionID" property from the action.
              if (action.actionID) {
                delete action.actionID
              }

              // Remove the "effectID" property from the action.
              if (action.effects && action.effects.length > 0) {
                for (let effect of action.effects) {
                  if (effect.id) {
                    delete effect.id
                  }
                }
              }
            }
          }
        }

        // -- BUILD 23 --
        // This migration script is responsible
        // for adding the new "forces" property
        // to the mission schema, moving the
        // node data in the mission to a new default
        // force, and removing the "nodeData" property
        // from the mission.
        if (schemaBuildNumber < 23) {
          let mission = missionData

          // Add the "forces" property to the mission.
          mission.forces = [
            {
              name: 'Friendly Force',
              color: '#52b1ff',
              nodes: mission.nodeData,
            },
          ]

          // Remove the "nodeData" property from the mission.
          delete mission.nodeData
        }

        // -- BUILD 24 --
        // This migration script is responsible
        // for converting the "effects" property
        // to "externalEffects" and adding the
        // "internalEffects" property to the mission schema.
        if (schemaBuildNumber < 24) {
          let mission = missionData

          // Loop through all forces.
          for (let force of mission.forces) {
            // Loop through all nodes.
            for (let node of force.nodes) {
              // Loop through all actions.
              for (let action of node.actions) {
                // If the action doesn't have internalEffects,
                // set it to an empty array.
                if (!('internalEffects' in action)) {
                  action.internalEffects = []
                }

                // Rename the "effects" property to "externalEffects".
                if (action.effects) {
                  action.externalEffects = action.effects
                  delete action.effects
                }
              }
            }
          }
        }

        // -- BUILD 25 --
        // This migration script is responsible
        // for converting the "externalEffects" property
        // to "effects" and removing the "internalEffects"
        // property from the mission schema. This script
        // also converts any properties with "<p><br></p>"
        // to an empty string ("").
        if (schemaBuildNumber < 25) {
          let mission = missionData

          // Loop through forces.
          for (let force of mission.forces) {
            // Loop through nodes.
            for (let node of force.nodes) {
              // If the description has "<p><br></p>",
              // set it to an empty string.
              if (node.description === '<p><br></p>') {
                node.description = ''
              }
              // If the preExecutionText has "<p><br></p>",
              // set it to an empty string.
              if (node.preExecutionText === '<p><br></p>') {
                node.preExecutionText = ''
              }

              // Loop through actions.
              for (let action of node.actions) {
                // If the description has "<p><br></p>",
                // set it to an empty string.
                if (action.description === '<p><br></p>') {
                  action.description = ''
                }

                // If the action does have internalEffects,
                // delete internalEffects.
                if (action.internalEffects) {
                  delete action.internalEffects
                }
                // If the action does have externalEffects,
                // set effects to externalEffects and delete
                // externalEffects.
                if (action.externalEffects) {
                  action.effects = action.externalEffects
                  delete action.externalEffects
                }

                // Loop through effects.
                for (let effect of action.effects) {
                  // If the description has "<p><br></p>",
                  // set it to an empty string.
                  if (effect.description === '<p><br></p>') {
                    effect.description = ''
                  }
                }
              }
            }
          }
        }

        // -- BUILD 26 --
        // This migration script is responsible
        // for converting any objects nested within
        // a mission that have an "_id" property that
        // is an ObjectId to a UUID.
        if (schemaBuildNumber < 26) {
          let mission = missionData

          // Loop through forces.
          for (let force of mission.forces) {
            // If the force has an ObjectId as the _id,
            // generate a UUID and set it as the _id.
            if (mongoose.isObjectIdOrHexString(force._id)) {
              force._id = generateHash()
            }

            // Loop through nodes.
            for (let node of force.nodes) {
              // If the node has an ObjectId as the _id,
              // generate a UUID and set it as the _id.
              if (mongoose.isObjectIdOrHexString(node._id)) {
                node._id = generateHash()
              }

              // Loop through actions.
              for (let action of node.actions) {
                // If the action has an ObjectId as the _id,
                // generate a UUID and set it as the _id.
                if (mongoose.isObjectIdOrHexString(action._id)) {
                  action._id = generateHash()
                }

                // Loop through effects.
                for (let effect of action.effects) {
                  // If the effect has an ObjectId as the _id,
                  // generate a UUID and set it as the _id.
                  if (mongoose.isObjectIdOrHexString(effect._id)) {
                    effect._id = generateHash()
                  }
                }
              }
            }
          }
        }

        // -- BUILD 27 --
        // This migration script is responsible
        // for moving initial resources from the
        // mission level to the force level.
        if (schemaBuildNumber < 27) {
          let mission = missionData

          // Loop through forces.
          for (let force of mission.forces) {
            // If the force doesn't have initialResources,
            // set it to the mission's initialResources.
            if (!force.initialResources) {
              force.initialResources = mission.initialResources
            }
          }

          // Delete the initialResources property from the mission.
          delete mission.initialResources
        }

        // -- BUILD 28 --
        // This migration script is responsible
        // for moving the introMessage from the
        // mission level to the force level.
        if (schemaBuildNumber < 28) {
          let mission = missionData

          // Loop through forces.
          for (let force of mission.forces) {
            // If the force doesn't have introMessage,
            // set it to the mission's introMessage.
            if (!force.introMessage) {
              force.introMessage = mission.introMessage
            }
          }

          // Delete the introMessage property from the mission.
          delete mission.introMessage
        }
      }

      // This will be called when it is
      // finally time to send the response
      // for this request.
      const finalizeResponse = (): void => {
        if (failedImportCount > 0) {
          databaseLogger.error(
            `Failed to import ${failedImportCount} missions.`,
          )
        }

        response.json({
          successfulImportCount,
          failedImportCount,
          failedImportErrorMessages,
        })
      }

      // Iterates through files.
      request.files.forEach((file: MulterFile, index: number) => {
        let contents_string: string
        let contents_JSON: any

        // Reads files contents.
        try {
          contents_string = fs.readFileSync(file.path, {
            encoding: 'utf-8',
          })
        } catch (error: any) {
          error.message =
            'Failed to read file. This file is either not actually a .cesar file, not actually a .metis file, or is corrupted.'

          return handleMissionImportError(file, error)
        }

        // Converts to JSON.
        try {
          contents_JSON = JSON.parse(contents_string)
        } catch (error: any) {
          // An error may occur due
          // to a syntax error with the JSON.
          let syntaxErrorRegularExpression: RegExp =
            /in JSON at position [0-9]+/
          let errorAsString: string = `${error}`
          let errorMessage: string = 'Error parsing JSON.\n'

          let syntaxErrorResults: RegExpMatchArray | null = errorAsString.match(
            syntaxErrorRegularExpression,
          )

          if (syntaxErrorResults !== null) {
            let match: string = syntaxErrorResults[0]
            let matchSplit: string[] = match.split(' ')
            let characterPosition: number = parseInt(
              matchSplit[matchSplit.length - 1],
            )
            let contextStart: number = Math.max(characterPosition - 24, 0)
            let contextEnd: number = Math.min(
              characterPosition + 24,
              contents_string.length - 1,
            )
            let surroundingContext: string = contents_string.substring(
              contextStart,
              contextEnd,
            )

            while (surroundingContext.includes('\n')) {
              surroundingContext = surroundingContext.replace('\n', ' ')
            }
            surroundingContext = surroundingContext.trim()

            errorMessage += `Unexpected token in JSON at character ${
              characterPosition + 1
            }.`
            // errorMessage += `${surroundingContext}`
          }

          error.message = errorMessage

          return handleMissionImportError(file, error)
        }

        // If the file's schemaBuildNumber is 9
        // or less and it is not a .cesar file,
        // it is skipped.
        if (
          contents_JSON.schemaBuildNumber <= 9 &&
          !file.originalname.toLowerCase().endsWith('.cesar')
        ) {
          let error: Error = new Error(
            `The file "${file.originalname}" was rejected because it did not have the .cesar extension.`,
          )

          return handleMissionImportError(file, error)
        }
        // If the file's schemaBuildNumber is 10
        // or greater and it is not a .metis file,
        // it is skipped.
        else if (
          contents_JSON.schemaBuildNumber >= 10 &&
          !file.originalname.toLowerCase().endsWith('.metis')
        ) {
          let error: Error = new Error(
            `The file "${file.originalname}" was rejected because it did not have the .metis extension.`,
          )

          return handleMissionImportError(file, error)
        }

        // Migrates if necessary.
        migrateIfOutdated(contents_JSON, file)

        // Model creation.
        try {
          // Deletes the schemaBuildNumber field
          // so an error isn't thrown, since the
          // schema is set to strict and this field
          // is not in the schema.
          delete contents_JSON.schemaBuildNumber

          let mission = new MissionModel(contents_JSON)

          // Model saved.
          mission.save((error: Error) => {
            if (error) {
              handleMissionImportError(file, error)
            } else {
              databaseLogger.info(
                `New mission created named "${mission.name}".`,
              )

              successfulImportCount++
              fileProcessCount++
            }

            if (fileProcessCount === request.files?.length) {
              return finalizeResponse()
            }
          })
        } catch (error: any) {
          if (
            error.message.endsWith(
              'is not in schema and strict mode is set to throw.',
            )
          ) {
            error.message = error.message.replace(
              'is not in schema and strict mode is set to throw.',
              'is not in schema. Please delete this field and try again.',
            )
          }

          return handleMissionImportError(file, error)
        }
      })

      if (
        fileProcessCount === request.files?.length &&
        fileProcessCount === failedImportCount
      ) {
        return finalizeResponse()
      }
    } else {
      return response.sendStatus(400)
    }
  }

  /* ---------------------------- READ ------------------------------ */

  /**
   * This will retrieve all missions.
   * @returns All missions in JSON format.
   */
  const getMissions = (request: Request, response: Response) => {
    MissionModel.find({}, { nodeStructure: 0, forces: 0 })
      .queryForApiResponse('find')
      .exec((error: Error, missions: any) => {
        if (error !== null || missions === null) {
          databaseLogger.error('Failed to retrieve missions.')
          databaseLogger.error(error)
          return response.sendStatus(500)
        } else {
          databaseLogger.info('All missions retrieved.')
          return response.json(missions)
        }
      })
  }

  /**
   * This will retrieve a specific mission.
   * @returns The mission in JSON format.
   */
  const getMission = (request: Request, response: Response) => {
    let _id = request.params._id

    MissionModel.findOne({ _id })
      .queryForApiResponse('findOne')
      .exec((error: Error, mission: any) => {
        if (error !== null) {
          databaseLogger.error(`Failed to retrieve mission with ID "${_id}".`)
          databaseLogger.error(error)
          return response.sendStatus(500)
        } else if (mission === null) {
          return response.sendStatus(404)
        } else {
          databaseLogger.info(`Mission with ID "${_id}" retrieved.`)
          return response.json(mission)
        }
      })
  }

  /**
   * This will export a mission to a file.
   * @returns The mission file.
   */
  const exportMission = (request: Request, response: Response) => {
    let _id = request.params._id

    // Retrieve database info.
    InfoModel.findOne(
      {},
      filterErrors_findOne('infos', response, (info: any) => {
        databaseLogger.info('Database info retrieved.')

        // Retrieve original mission.
        MissionModel.findOne({ _id })
          .queryForApiResponse('findOne')
          .exec(
            filterErrors_findOne('missions', response, (mission: any) => {
              databaseLogger.info(`Mission with ID "${_id}" retrieved.`)

              // Gather details for temporary file
              // that will be sent in the response.
              let tempSubfolderName: string = generateHash()
              let tempFileName: string = `${mission.name}.metis`
              let tempFolderPath: string = path.join(
                MetisServer.APP_DIR,
                '/temp/missions/exports/',
              )
              let tempSubfolderPath: string = path.join(
                tempFolderPath,
                tempSubfolderName,
              )
              let tempFilePath: string = path.join(
                tempSubfolderPath,
                tempFileName,
              )
              let tempFileContents = JSON.stringify(
                {
                  ...mission._doc,
                  _id: undefined,
                  deleted: undefined,
                  schemaBuildNumber: info.schemaBuildNumber,
                },
                null,
                2,
              )

              // Create the temp directory
              // if it doesn't exist.
              if (!fs.existsSync(tempFolderPath)) {
                fs.mkdirSync(tempFolderPath, { recursive: true })
              }

              // Create the file.
              fs.mkdirSync(tempSubfolderPath, {})
              fs.writeFileSync(tempFilePath, tempFileContents)

              // Send it in the response.
              response.sendFile(tempFilePath)
            }),
          )
      }),
    )
  }

  /**
   * This will return the environment
   * of the database that is currently
   * in use.
   * @returns The environment.
   */
  const getEnvironment = (request: Request, response: Response) =>
    response.send(process.env)

  /* ---------------------------- UPDATE ---------------------------- */

  /**
   * This will update a mission.
   * @returns The updated mission in JSON format.
   */
  const updateMission = (request: Request, response: Response) => {
    let missionUpdates: any = request.body

    let _id: string = missionUpdates._id

    // Original mission is retrieved.
    MissionModel.findOne({ _id }).exec((error: Error, mission: any) => {
      // Handles errors.
      if (error !== null) {
        databaseLogger.error(`### Failed to retrieve mission with ID "${_id}".`)
        databaseLogger.error(error)
        return response.sendStatus(500)
      }
      // Handles mission not found.
      else if (mission === null) {
        return response.sendStatus(404)
      }
      // Handle proper mission retrieval.
      else {
        // Places all values found in
        // missionUpdates and puts it in
        // the retrieved mongoose document.
        for (let key in missionUpdates) {
          if (key !== '_id') {
            mission[key] = missionUpdates[key]
          }
        }

        // Save the updated mission.
        mission.save((error: Error) => {
          // Handles errors.
          if (error !== null) {
            databaseLogger.error(
              `### Failed to update mission with ID "${_id}".`,
            )
            databaseLogger.error(error)

            // If this error was a validation error,
            // then it is a bad request.
            if (
              error.name === MetisDatabase.ERROR_BAD_DATA ||
              error.message.includes('validation failed')
            ) {
              return response.sendStatus(400)
            }
            // Else it's a server error.
            else {
              return response.sendStatus(500)
            }
          }
          // Handles successful save.
          else {
            // Retrieves newly updated mission
            // to return in response. This is
            // called again, one to call the
            // queryForApiResponse function,
            // and two, to ensure what's returned
            // is what is in the database.
            MissionModel.findOne({ _id })
              .queryForApiResponse('findOne')
              .exec((error: Error, mission: any) => {
                // If something goes wrong, this is
                // a server issue. If there was something
                // the client did, an error would have
                // already been thrown in the first query.
                if (error || !mission) {
                  databaseLogger.error(
                    'Failed to retrieve newly updated mission',
                  )
                  databaseLogger.error(error)
                  return response.sendStatus(500)
                } else {
                  // Return updated mission to the user.
                  return response.json(mission)
                }
              })
          }
        })
      }
    })
  }

  /**
   * This will copy a mission.
   * @returns The copied mission in JSON format.
   */
  const copyMission = (request: Request, response: Response) => {
    let body: any = request.body

    let originalId: string = body.originalId
    let copyName: string = body.copyName

    MissionModel.findOne({ _id: originalId }, (error: any, mission: any) => {
      if (error !== null) {
        databaseLogger.error(
          `Failed to copy mission with the original ID "${originalId}":`,
        )
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else if (mission === null) {
        return response.sendStatus(404)
      } else {
        let modelInput: Partial<TCommonMissionJson> = {
          name: copyName,
          versionNumber: mission.versionNumber,
          nodeStructure: mission.nodeStructure,
          forces: mission.forces,
        }

        let copy = new MissionModel(modelInput)

        copy.save((error: Error, result: any) => {
          if (error) {
            databaseLogger.error(
              `Failed to copy mission with the original ID "${originalId}":`,
            )
            databaseLogger.error(error)
            return response.sendStatus(500)
          } else {
            console.log(result)
            databaseLogger.info(
              `Copied mission with the original ID "${originalId}".`,
            )
            return response.json({
              _id: result._id,
              name: result.name,
              versionNumber: result.versionNumber,
              seed: result.seed,
            })
          }
        })
      }
    })
  }

  /* ---------------------------- DELETE ---------------------------- */

  /**
   * This will delete a mission.
   * @returns HTTP status code.
   */
  const deleteMission = (request: Request, response: Response) => {
    let _id: any = request.params._id

    MissionModel.updateOne({ _id }, { deleted: true }, (error: any) => {
      if (error !== null) {
        databaseLogger.error('Failed to delete mission:')
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else {
        databaseLogger.info(`Deleted mission with the ID "${_id}".`)
        return response.sendStatus(200)
      }
    })
  }

  /* ---------------------------- ROUTES ---------------------------- */

  router.post(
    '/',
    auth({ permissions: ['missions_write'] }),
    defineRequests({
      body: {
        name: RequestBodyFilters.STRING,
        versionNumber: RequestBodyFilters.NUMBER,
        nodeStructure: RequestBodyFilters.OBJECT,
        forces: RequestBodyFilters.ARRAY,
      },
    }),
    createMission,
  )
  router.post(
    '/import/',
    auth({ permissions: ['missions_write'] }),
    uploads.array('files', 12),
    importMission,
  )
  router.get('/environment/', getEnvironment)
  router.get('/', auth({ permissions: ['missions_read'] }), getMissions)
  router.get(
    '/:_id/',
    auth({ permissions: ['missions_read'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    getMission,
  )
  router.get(
    '/:_id/export/*', // The "*" is to ensure the downloaded file includes the mission's name and the .metis extension.
    auth({ permissions: ['missions_read', 'missions_write'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    exportMission,
  )
  router.put(
    '/',
    auth({ permissions: ['missions_write'] }),
    defineRequests(
      {
        body: {
          _id: RequestBodyFilters.OBJECTID,
        },
      },
      {
        body: {
          name: RequestBodyFilters.STRING,
          versionNumber: RequestBodyFilters.NUMBER,
          initialResources: RequestBodyFilters.NUMBER,
          nodeStructure: RequestBodyFilters.OBJECT,
          forces: RequestBodyFilters.ARRAY,
        },
      },
    ),
    updateMission,
  )
  router.put(
    '/copy/',
    auth({ permissions: ['missions_write'] }),
    defineRequests({
      body: {
        copyName: RequestBodyFilters.STRING,
        originalId: RequestBodyFilters.OBJECTID,
      },
    }),
    copyMission,
  )
  router.delete(
    '/:_id/',
    auth({ permissions: ['missions_write'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    deleteMission,
  )

  done()
}

export default routerMap
