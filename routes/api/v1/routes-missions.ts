//npm imports
import express from 'express'
import fs from 'fs'
import path from 'path'
import { v4 as generateHash } from 'uuid'
import { filterErrors_findOne } from '../../../database/api-call-handlers'
import { ERROR_BAD_DATA } from '../../../database/database'
import InfoModel from '../../../database/models/model-info'
import MissionModel from '../../../database/models/model-mission'
import { databaseLogger } from '../../../modules/logging'
import { hasPermittedRole, requireLogin } from '../../../user'
import { APP_DIR } from '../../../config'
import uploads from '../../../middleware/uploads'
import { commandScripts } from '../../../action-execution'
import validateRequestBodyKeys, {
  RequestBodyFilters,
  validateRequestQueryKeys,
} from '../../../modules/requests'
import { colorOptions } from '../../../modules/mission-node-colors'

type MulterFile = Express.Multer.File

//fields
const router = express.Router()

// -- POST | /api/v1/missions/ --
// This will create a new mission.
router.post(
  '/',
  requireLogin,
  validateRequestBodyKeys({
    name: RequestBodyFilters.STRING,
    introMessage: RequestBodyFilters.STRING,
    versionNumber: RequestBodyFilters.NUMBER,
    live: RequestBodyFilters.BOOLEAN,
    initialResources: RequestBodyFilters.NUMBER,
    nodeStructure: RequestBodyFilters.OBJECT,
    nodeData: RequestBodyFilters.OBJECT,
  }),
  (request, response) => {
    let body: any = request.body

    let missionData: any = body.mission

    let name: any = missionData.name
    let introMessage: any = missionData.introMessage
    let versionNumber: any = missionData.versionNumber
    let live: any = missionData.live
    let initialResources: any = missionData.initialResources
    let nodeStructure: any = missionData.nodeStructure
    let nodeData: any = missionData.nodeData

    let mission = new MissionModel({
      name,
      introMessage,
      versionNumber,
      live,
      initialResources,
      nodeStructure,
      nodeData,
    })

    mission.save((error: Error) => {
      if (error) {
        databaseLogger.error('Failed to create mission:')
        databaseLogger.error(error)

        if (error.name === ERROR_BAD_DATA) {
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
        MissionModel.findOne({ missionID: mission.missionID })
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
              return response.send({ mission })
            }
          })
      }
    })
  },
)

// -- POST | /api/v1/missions/import/ --
router.post(
  '/import/',
  requireLogin,
  uploads.array('files', 12),
  (request, response) => {
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
            let actions: Array<any> = nodeDatum.actions

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
  },
)

// -- GET | /api/v1/missions/ --
// This will return all of the missions.
router.get(
  '/',
  validateRequestQueryKeys({ missionID: 'objectId' }),
  (request, response) => {
    let missionID = request.query.missionID

    if (missionID === undefined) {
      let queries: any = {}

      if (!hasPermittedRole(request)) {
        queries.live = true
      }

      MissionModel.find({ ...queries }, { nodeStructure: 0, nodeData: 0 })
        .queryForApiResponse('find')
        .exec((error: Error, missions: any) => {
          if (error !== null || missions === null) {
            databaseLogger.error('Failed to retrieve missions.')
            databaseLogger.error(error)
            return response.sendStatus(500)
          } else {
            databaseLogger.info('All missions retrieved.')
            return response.json({ missions })
          }
        })
    } else {
      MissionModel.findOne({ missionID })
        .queryForApiResponse('findOne')
        .exec((error: Error, mission: any) => {
          if (error !== null) {
            databaseLogger.error(
              `Failed to retrieve mission with ID "${missionID}".`,
            )
            databaseLogger.error(error)
            return response.sendStatus(500)
          } else if (mission === null) {
            return response.sendStatus(404)
          } else if (!mission.live && !hasPermittedRole(request)) {
            return response.sendStatus(401)
          } else {
            databaseLogger.info(`Mission with ID "${missionID}" retrieved.`)
            return response.json({ mission })
          }
        })
    }
  },
)

// -- GET /api/v1/missions/export/
// This will return all of the missions.
router.get(
  '/export/*',
  requireLogin,
  validateRequestQueryKeys({ missionID: 'objectId' }),
  (request, response) => {
    let missionID = request.query.missionID

    // Retrieve database info.
    InfoModel.findOne(
      { infoID: 'default' },
      filterErrors_findOne('infos', response, (info: any) => {
        databaseLogger.info('Database info retrieved.')

        // Retrieve original mission.
        MissionModel.findOne({ missionID })
          .queryForApiResponse('findOne')
          .exec(
            filterErrors_findOne('missions', response, (mission: any) => {
              databaseLogger.info(`Mission with ID "${missionID}" retrieved.`)

              // Gather details for temporary file
              // that will be sent in the response.
              let tempSubfolderName: string = generateHash()
              let tempFileName: string = `${mission.name}.metis`
              let tempFolderPath: string = path.join(
                APP_DIR,
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
                  missionID: undefined,
                  live: undefined,
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
  },
)

// -- GET /api/v1/missions/environment/
// This will return the environment of
// the database that is currently in use.
router.get(
  '/environment/',
  validateRequestQueryKeys({}),
  (request, response) => {
    response.send(process.env)
  },
)

// -- GET /api/v1/missions/colors/
// This will return all the available
// color options that can be used to
// style a mission-node.
router.get('/colors/', validateRequestQueryKeys({}), (request, response) => {
  response.json({ colorOptions })
})

// -- PUT /api/v1/missions/handle-action-execution/
// This handles the effect on an asset
// after an action is executed successfully
router.put(
  '/handle-action-execution/',
  requireLogin,
  validateRequestBodyKeys({
    missionID: RequestBodyFilters.OBJECTID,
    nodeID: RequestBodyFilters.STRING,
    actionID: RequestBodyFilters.STRING,
  }),
  (request, response) => {
    let body: any = request.body

    let missionID = body.missionID
    let nodeID = body.nodeID
    let actionID = body.actionID

    MissionModel.findOne({ missionID }).exec((error: Error, mission: any) => {
      // Handles errors.
      if (error !== null) {
        databaseLogger.error(
          `### Failed to retrieve mission with ID "${missionID}".`,
        )
        databaseLogger.error(error)
        return response.sendStatus(500)
      }
      // Handles mission not found.
      else if (mission === null) {
        return response.sendStatus(404)
      }
      // Handle proper mission retrieval.
      else {
        mission.nodeData.forEach((node: any) => {
          if (node.nodeID === nodeID) {
            node.actions.forEach((action: any) => {
              if (action.actionID === actionID) {
                for (let script of action.scripts) {
                  commandScripts[script.scriptName](script.args)
                }
              }
            })
          }
        })
        return response.sendStatus(200)
      }
    })
  },
)

// -- PUT | /api/v1/missions/ --
// This will update the mission.
router.put(
  '/',
  requireLogin,
  validateRequestBodyKeys(
    {
      missionID: RequestBodyFilters.OBJECTID,
    },
    {
      name: RequestBodyFilters.STRING,
      introMessage: RequestBodyFilters.STRING,
      versionNumber: RequestBodyFilters.NUMBER,
      initialResources: RequestBodyFilters.NUMBER,
      live: RequestBodyFilters.BOOLEAN,
      nodeStructure: RequestBodyFilters.OBJECT,
      nodeData: RequestBodyFilters.OBJECT,
    },
  ),
  (request, response) => {
    let body: any = request.body

    let missionUpdates: any = body.mission

    let missionID: string = missionUpdates.missionID

    // Original mission is retrieved.
    MissionModel.findOne({ missionID }).exec((error: Error, mission: any) => {
      // Handles errors.
      if (error !== null) {
        databaseLogger.error(
          `### Failed to retrieve mission with ID "${missionID}".`,
        )
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
          if (key !== '_id' && key !== 'missionID') {
            mission[key] = missionUpdates[key]
          }
        }

        // Save the updated mission.
        mission.save((error: Error) => {
          // Handles errors.
          if (error !== null) {
            databaseLogger.error(
              `### Failed to update mission with ID "${missionID}".`,
            )
            databaseLogger.error(error)

            // If this error was a validation error,
            // then it is a bad request.
            if (error.message.includes('validation failed')) {
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
            MissionModel.findOne({ missionID })
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
                  return response.send({ mission })
                }
              })
          }
        })
      }
    })

    // MissionModel.updateOne({ missionID }, mission, (error: any) => {
    //   if (error !== null) {
    //     databaseLogger.error(
    //       `Failed to update mission with the ID "${missionID}".`,
    //     )
    //     databaseLogger.error(error)
    //     return response.sendStatus(500)
    //   } else {
    //     databaseLogger.info(`Updated mission with the ID "${missionID}".`)
    //     return response.sendStatus(200)
    //   }
    // })
  },
)

// -- PUT | /api/v1/missions/copy/ --
// This will copy a mission.
router.put(
  '/copy/',
  requireLogin,
  validateRequestBodyKeys({
    copyName: RequestBodyFilters.STRING,
    originalID: RequestBodyFilters.STRING,
  }),
  (request, response) => {
    let body: any = request.body

    let originalID: string = body.originalID
    let copyName: string = body.copyName

    MissionModel.findOne(
      { missionID: originalID },
      (error: any, mission: any) => {
        if (error !== null) {
          databaseLogger.error(
            `Failed to copy mission with the original ID "${originalID}":`,
          )
          databaseLogger.error(error)
          return response.sendStatus(500)
        } else if (mission === null) {
          return response.sendStatus(404)
        } else {
          let copy = new MissionModel({
            name: copyName,
            introMessage: mission.introMessage,
            versionNumber: mission.versionNumber,
            live: mission.live,
            initialResources: mission.initialResources,
            nodeStructure: mission.nodeStructure,
            nodeData: mission.nodeData,
          })

          copy.save((error: Error) => {
            if (error) {
              databaseLogger.error(
                `Failed to copy mission with the original ID "${originalID}":`,
              )
              databaseLogger.error(error)
              return response.sendStatus(500)
            } else {
              databaseLogger.info(
                `Copied mission with the original ID "${originalID}".`,
              )
              return response.json({ copy })
            }
          })
        }
      },
    )
  },
)

// -- DELETE | /api/v1/missions/ --
// This will delete a mission.
router.delete(
  '/',
  requireLogin,
  validateRequestQueryKeys({ missionID: 'objectId' }),
  (request, response) => {
    let query: any = request.query

    let missionID: any = query.missionID

    MissionModel.updateOne({ missionID }, { deleted: true }, (error: any) => {
      if (error !== null) {
        databaseLogger.error('Failed to delete mission:')
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else {
        databaseLogger.info(`Deleted mission with the ID "${missionID}".`)
        return response.sendStatus(200)
      }
    })
  },
)

module.exports = router
