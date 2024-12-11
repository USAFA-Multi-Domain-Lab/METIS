import { Request, Response } from 'express-serve-static-core'
import fs from 'fs'
import MissionModel from 'metis/server/database/models/missions'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import { AnyObject } from 'metis/toolbox/objects'
import mongoose from 'mongoose'
import { v4 as generateHash } from 'uuid'
import ApiResponse from '../../library/response'

type MulterFile = Express.Multer.File

/**
 * This class is responsible for executing the import of .metis and .cesar files.
 */
class MissionImport {
  /**
   * Keeps track of the number of files that have been processed.
   */
  private fileProcessCount: number = 0
  /**
   * Keeps track of the number of files that have been successfully imported.
   */
  private successfulImportCount: number = 0
  /**
   * Keeps track of the number of files that have failed to import.
   */
  private failedImportCount: number = 0
  /**
   * Keeps track of the error messages for the files that have failed to import.
   */
  private failedImportErrorMessages: Array<{
    fileName: string
    errorMessage: string
  }> = []

  /**
   * Handles the error that occurs when a mission fails to import.
   * @param file The file that failed to import.
   * @param error The error that occurred.
   */
  private handleMissionImportError = (file: MulterFile, error: Error): void => {
    // Log the error.
    databaseLogger.error(
      `Failed to import mission "${file.originalname}".\n`,
      error,
    )
    // Create the error message.
    let fileName: string = file.originalname
    let errorMessage: string = error.message
    // Replace all backticks with asterisks.
    while (errorMessage.includes('`')) {
      errorMessage = errorMessage.replace('`', '*')
    }
    // Add the error message to the list of failed imports.
    this.failedImportErrorMessages.push({
      fileName,
      errorMessage,
    })
    // Increment the failed import count.
    this.failedImportCount++
    this.fileProcessCount++
  }

  /**
   * Converts the contents of the file to a `JSON` object.
   * @param contents_string The contents of the file as a `string`.
   * @returns The contents of the file as a `JSON` object.
   */
  private toJson = (contents_string: string): AnyObject => {
    // The JSON object that will be returned.
    let contents_JSON: AnyObject

    // Converts to JSON.
    try {
      contents_JSON = JSON.parse(contents_string)
    } catch (error: any) {
      // An error may occur due
      // to a syntax error with the JSON.
      let syntaxErrorRegularExpression: RegExp = /in JSON at position [0-9]+/
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
      }

      error.message = errorMessage

      throw error
    }

    // If the file passed all checks, return the JSON.
    return contents_JSON
  }

  /**
   * Validates the contents of the file.
   * @param file The file to validate.
   * @param contents_JSON The contents of the file as a `JSON` object.
   */
  private validateFileContents = (
    file: MulterFile,
    contents_JSON: AnyObject,
  ): void => {
    // If the JSON is not an object,
    // handle the error.
    if (!contents_JSON) {
      throw new Error(
        'Failed to parse JSON. This file is either not actually a .cesar file, not actually a .metis file, or is corrupted.',
      )
    }

    // If the schemaBuildNumber field is missing,
    // handle the error.
    if (!contents_JSON.schemaBuildNumber) {
      throw new Error('The schemaBuildNumber field is missing from the JSON.')
    }

    // If the file's schemaBuildNumber is 9
    // or less and it is not a .cesar file,
    // it is skipped.
    if (
      contents_JSON.schemaBuildNumber <= 9 &&
      !file.originalname.toLowerCase().endsWith('.cesar')
    ) {
      throw new Error(
        `The file "${file.originalname}" was rejected because it did not have the .cesar extension.`,
      )
    }

    // If the file's schemaBuildNumber is 10
    // or greater and it is not a .metis file,
    // it is skipped.
    if (
      contents_JSON.schemaBuildNumber >= 10 &&
      !file.originalname.toLowerCase().endsWith('.metis')
    ) {
      throw new Error(
        `The file "${file.originalname}" was rejected because it did not have the .metis extension.`,
      )
    }

    // If the file does not have the .metis
    // or .cesar extension, it is skipped.
    if (
      !file.originalname.toLowerCase().endsWith('.metis') &&
      !file.originalname.toLowerCase().endsWith('.cesar')
    ) {
      throw new Error(
        `The file "${file.originalname}" was rejected because it did not have the .metis or .cesar extension.`,
      )
    }
  }

  /**
   * Migrates the mission data if it is outdated.
   * @param missionData The mission data to migrate.
   */
  private migrateIfOutdated = (missionData: any): void => {
    let schemaBuildNumber: number = missionData.schemaBuildNumber

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
          nodeDatum.preExecutionText === '<p>Node has not been executed.</p>'
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
    // is an ObjectId to a UUID. Also, if the "_id"
    // property is missing, a UUID will be generated
    // and set as the "_id" property.
    if (schemaBuildNumber < 26) {
      let mission = missionData

      // Loop through forces.
      for (let force of mission.forces) {
        // If the force has an ObjectId as the _id,
        // or if the _id is missing, generate a UUID
        // and set it as the _id.
        if (mongoose.isObjectIdOrHexString(force._id) || !force._id) {
          force._id = generateHash()
        }

        // Loop through nodes.
        for (let node of force.nodes) {
          // If the node has an ObjectId as the _id,
          // or if the _id is missing, generate a UUID
          // and set it as the _id.
          if (mongoose.isObjectIdOrHexString(node._id) || !node._id) {
            node._id = generateHash()
          }

          // Loop through actions.
          for (let action of node.actions) {
            // If the action has an ObjectId as the _id,
            // or if the _id is missing, generate a UUID
            // and set it as the _id.
            if (mongoose.isObjectIdOrHexString(action._id) || !action._id) {
              action._id = generateHash()
            }

            // Loop through effects.
            for (let effect of action.effects) {
              // If the effect has an ObjectId as the _id,
              // or if the _id is missing, generate a UUID
              // and set it as the _id.
              if (mongoose.isObjectIdOrHexString(effect._id) || !effect._id) {
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

    // -- BUILD 29 --
    // This migration script is responsible
    // for creating an array of prototypes
    // within a mission and extracting the
    // "structureKey" and "depthPadding"
    // properties from the "nodes" array
    // and setting them on the prototype.
    // It also renames the "nodeStructure"
    // property to "structure" and adds a
    // "prototypeId" property to each node.
    if (schemaBuildNumber < 29) {
      let mission = missionData

      // Rename nodeStructure to structure.
      mission.structure = mission.nodeStructure
      delete mission.nodeStructure

      // Create prototypes array.
      mission.prototypes = []

      // Loop through forces.
      for (let force of mission.forces) {
        // Loop through nodes.
        for (let node of force.nodes) {
          // See if prototype already exists.
          let prototype = mission.prototypes.find(
            (prototype: any) => prototype.structureKey === node.structureKey,
          )

          // If the prototype doesn't already exist, create it.
          if (prototype === undefined) {
            let prototypeId = generateHash()

            // Create prototype object.
            let prototype = {
              _id: prototypeId,
              structureKey: node.structureKey,
              depthPadding: node.depthPadding,
            }

            // Add prototype to mission.
            mission.prototypes.push(prototype)

            // Set prototypeId on node.
            node.prototypeId = prototypeId
          }
          // Set prototypeId on node.
          else {
            node.prototypeId = prototype._id
          }

          // Delete structureKey and depthPadding from node.
          delete node.structureKey
          delete node.depthPadding
        }
      }
    }
  }

  /**
   * Finalizes the response to the client.
   * @param response The response to send to the client.
   */
  private finalizeResponse = (response: Response): void => {
    if (this.failedImportCount > 0) {
      databaseLogger.error(
        `Failed to import ${this.failedImportCount} missions.`,
      )
    }

    ApiResponse.sendJson(response, {
      successfulImportCount: this.successfulImportCount,
      failedImportCount: this.failedImportCount,
      failedImportErrorMessages: this.failedImportErrorMessages,
    })
  }

  /**
   * Executes the import of the mission.
   * @param files An array of files to import.
   * @param response The response to send to the client.
   * @returns A promise that resolves when the import is complete.
   */
  public execute = async (
    files: MulterFile[],
    response: Response,
  ): Promise<void> => {
    const promises = files.map(async (file) => {
      let contents_string: string
      let contents_JSON: AnyObject

      // Reads files contents.
      try {
        contents_string = await fs.promises.readFile(file.path, {
          encoding: 'utf-8',
        })
      } catch (error: any) {
        error.message =
          'Failed to read file. This file is either not actually a .cesar file, not actually a .metis file, or is corrupted.'

        this.handleMissionImportError(file, error)
        return
      }

      try {
        // Convert the contents of the file to JSON.
        contents_JSON = this.toJson(contents_string)
        // Validates the contents of the file.
        this.validateFileContents(file, contents_JSON)
        // Migrates if necessary.
        this.migrateIfOutdated(contents_JSON)
      } catch (error: any) {
        this.handleMissionImportError(file, error)
        return
      }

      // Model creation.
      try {
        // Deletes the schemaBuildNumber field
        // so an error isn't thrown, since the
        // schema is set to strict and this field
        // is not in the schema.
        delete contents_JSON.schemaBuildNumber

        // Create the new mission.
        let missionDoc = await MissionModel.create(contents_JSON)
        // Log the creation of the mission.
        databaseLogger.info(`New mission created named "${missionDoc.name}".`)
        // Indicate that the file was successfully imported.
        this.successfulImportCount++
        this.fileProcessCount++
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

        // Handle the error.
        this.handleMissionImportError(file, error)
      }
    })

    try {
      // Wait for all promises to resolve.
      await Promise.all(promises)
      // Finalize the response.
      this.finalizeResponse(response)
    } catch (error: any) {
      databaseLogger.error(
        'There was an error importing the missions.\n',
        error,
      )
    }
  }
}

/**
 * This will import a mission from a file.
 * @param request The express request.
 * @param response The express response.
 * @returns The response to send to the client.
 */
const importMission = async (request: Request, response: Response) => {
  // If no files are included in the request,
  // return a 400 status code.
  if (
    !request.files ||
    request.files.length === 0 ||
    !Array.isArray(request.files)
  ) {
    let error = new StatusError('No files were found in the request.', 400)
    return ApiResponse.error(error, response)
  }

  // Execute the mission import.
  await new MissionImport().execute(request.files, response)
}

export default importMission
