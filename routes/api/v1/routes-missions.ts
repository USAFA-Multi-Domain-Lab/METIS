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
import { isLoggedIn, requireLogin } from '../../../user'
import { APP_DIR } from '../../../config'
import uploads from '../../../middleware/uploads'

//fields
const router = express.Router()

// -- POST | /api/v1/missions/ --
// This will create a new mission.
router.post('/', requireLogin, (request, response) => {
  let body: any = request.body

  if ('mission' in body) {
    let missionData: any = body.mission

    if (
      'name' in missionData &&
      'versionNumber' in missionData &&
      'live' in missionData &&
      'initialResources' in missionData &&
      'nodeStructure' in missionData &&
      'nodeData' in missionData
    ) {
      let name: any = missionData.name
      let versionNumber: any = missionData.versionNumber
      let live: any = missionData.live
      let initialResources: any = missionData.initialResources
      let nodeStructure: any = missionData.nodeStructure
      let nodeData: any = missionData.nodeData

      let mission = new MissionModel({
        name,
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
          return response.json({ mission })
        }
      })
    }
  } else {
    return response.sendStatus(400)
  }
})

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

      // Iterates through files.
      request.files.forEach((file, index: number) => {
        // Reads files contents.
        let contents_string = fs.readFileSync(file.path, { encoding: 'utf-8' })

        // Converts to JSON.
        let contents_JSON = JSON.parse(contents_string)

        // Verifies valid properties were
        // included.
        if (
          'name' in contents_JSON &&
          'versionNumber' in contents_JSON &&
          'initialResources' in contents_JSON &&
          'schemaBuildNumber' in contents_JSON &&
          'nodeStructure' in contents_JSON &&
          'nodeData' in contents_JSON
        ) {
          let name: any = contents_JSON.name
          let versionNumber: any = contents_JSON.versionNumber
          let live: any = false
          let initialResources: any = contents_JSON.initialResources
          let nodeStructure: any = contents_JSON.nodeStructure
          let nodeData: any = contents_JSON.nodeData

          let mission = new MissionModel({
            name,
            versionNumber,
            live,
            initialResources,
            nodeStructure,
            nodeData,
          })

          mission.save((error: Error) => {
            if (error) {
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
            } else {
              databaseLogger.info(`New mission created named "${name}".`)

              successfulImportCount++
            }

            fileProcessCount++

            if (fileProcessCount === request.files?.length) {
              if (failedImportCount > 0) {
                databaseLogger.error(
                  `Failed to import ${failedImportCount} missions.`,
                )
              }

              return response.json({
                successfulImportCount,
                failedImportCount,
                failedImportErrorMessages,
              })
            }
          })
        } else {
          failedImportCount++
          fileProcessCount++
        }
      })

      if (
        fileProcessCount === request.files?.length &&
        fileProcessCount === failedImportCount
      ) {
        databaseLogger.error(`Failed to import ${failedImportCount} missions.`)

        return response.json({
          successfulImportCount,
          failedImportCount,
          failedImportErrorMessages,
        })
      }
    } else {
      return response.sendStatus(400)
    }
  },
)

// -- GET | /api/v1/missions/ --
// This will return all of the missions.
router.get('/', (request, response) => {
  let missionID = request.query.missionID

  if (missionID === undefined) {
    let queries: any = {}

    if (!isLoggedIn(request)) {
      queries.live = true
    }

    MissionModel.find({ ...queries })
      .select('-deleted -nodeStructure -nodeData')
      .where('deleted')
      .equals(false)
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
    MissionModel.findOne({ missionID }).exec((error: Error, mission: any) => {
      if (error !== null) {
        databaseLogger.error(
          `Failed to retrieve mission with ID "${missionID}".`,
        )
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else if (mission === null) {
        return response.sendStatus(404)
      } else if (!mission.live && !isLoggedIn(request)) {
        return response.sendStatus(401)
      } else {
        databaseLogger.info(`Mission with ID "${missionID}" retrieved.`)
        return response.json({ mission })
      }
    })
  }
})

// -- GET /api/v1/missions/export/
// This will return all of the missions.
router.get('/export/*', requireLogin, (request, response) => {
  let missionID = request.query.missionID

  if (missionID !== undefined) {
    // Retrieve database info.
    InfoModel.findOne(
      { infoID: 'default' },
      filterErrors_findOne('infos', response, (info: any) => {
        databaseLogger.info('Database info retrieved.')

        // Retrieve original mission.
        MissionModel.findOne({ missionID }).exec(
          filterErrors_findOne('missions', response, (mission: any) => {
            databaseLogger.info(`Mission with ID "${missionID}" retrieved.`)

            // Gather details for temporary file
            // that will be sent in the response.
            let tempSubfolderName: string = generateHash()
            let tempFileName: string = `${mission.name}.cesar`
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
  } else {
    return response.sendStatus(400)
  }
})

// -- PUT | /api/v1/missions/ --
// This will update the mission.
router.put('/', requireLogin, (request, response) => {
  let body: any = request.body

  if ('mission' in body) {
    let mission: any = body.mission

    if (typeof mission === 'object' && 'missionID' in mission) {
      let missionID: string = mission.missionID
      delete mission.missionID

      MissionModel.updateOne({ missionID }, mission, (error: any) => {
        if (error !== null) {
          databaseLogger.error(
            `Failed to update mission with the ID "${missionID}".`,
          )
          databaseLogger.error(error)
          return response.sendStatus(500)
        } else {
          databaseLogger.info(`Updated mission with the ID "${missionID}".`)
          return response.sendStatus(200)
        }
      })
    } else {
      return response.sendStatus(400)
    }
  } else {
    return response.sendStatus(400)
  }
})

// -- PUT | /api/v1/missions/copy/ --
// This will copy a mission.
router.put('/copy/', requireLogin, (request, response) => {
  let body: any = request.body

  if ('originalID' in body && 'copyName' in body) {
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
  } else {
    return response.sendStatus(400)
  }
})

// -- DELETE | /api/v1/missions/ --
// This will delete a mission.
router.delete('/', requireLogin, (request, response) => {
  let query: any = request.query

  if ('missionID' in query) {
    let missionID: any = query.missionID

    if (typeof missionID === 'string') {
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
    } else {
      return response.sendStatus(400)
    }
  } else {
    return response.sendStatus(400)
  }
})

module.exports = router
