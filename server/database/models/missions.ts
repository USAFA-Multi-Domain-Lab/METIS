import DOMPurify from 'isomorphic-dompurify'
import Mission, { TMissionSaveJson } from 'metis/missions'
import { databaseLogger } from 'metis/server/logging'
import ServerMission from 'metis/server/missions'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerEffect from 'metis/server/missions/effects'
import ServerMissionForce from 'metis/server/missions/forces'
import ServerMissionNode from 'metis/server/missions/nodes'
import StringToolbox from 'metis/toolbox/strings'
import { model, ProjectionType, QueryOptions, Schema } from 'mongoose'
import MetisDatabase from '..'
import { MissionSchema } from './classes'
import type {
  TMission,
  TMissionDoc,
  TMissionModel,
  TPostMissionQuery,
  TPreMissionQuery,
} from './types'

/* -- SCHEMA FUNCTIONS -- */

/**
 * Transforms the mission document to JSON.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use.
 * @returns The JSON representation of a `Mission` document.
 */
const toJson = (doc: TMissionDoc, ret: TMissionSaveJson, options: any) => {
  return {
    ...ret,
    _id: doc.id,
  }
}

/**
 * Modifies the query to hide deleted missions and remove unneeded properties.
 * @param query The query to modify.
 */
const queryForApiResponse = (query: TPreMissionQuery): void => {
  // Get projection.
  let projection = query.projection()

  // Create if does not exist.
  if (projection === undefined) {
    projection = {}
  }

  // Check if the projection is empty.
  let projectionKeys = Object.keys(projection)

  // If the projection is empty, create a default projection.
  if (projectionKeys.length === 0) {
    projection = {
      deleted: 0,
      __v: 0,
    }
  }

  // Set projection.
  query.projection(projection)
  // Hide deleted missions.
  query.where({ deleted: false })
}

/* -- SCHEMA STATIC FUNCTIONS -- */

/**
 * Finds a single document by its `_id` field. Then, if the
 * document is found, modifies the document with the given
 * updates using the `save` method.
 * @param _id The _id of the document to find.
 * @param projection The projection to use when finding the document.
 * @param options The options to use when finding the document.
 * @param updates The updates to apply to the document.
 * @resolves The modified document.
 * @rejects An error if the document is not found or is deleted.
 * @note This method uses the `findById` method internally followed by the `save` method (if the document is found).
 * @note This method will trigger the `pre('save')` middleware which validates the mission.
 */
const findByIdAndModify = (
  _id: any,
  projection?: ProjectionType<TMission> | null,
  options?: QueryOptions<TMission> | null,
  updates?: Partial<TMissionSaveJson> | null,
): Promise<TMissionDoc | null> => {
  return new Promise<TMissionDoc | null>(async (resolve, reject) => {
    try {
      // Find the mission document.
      let missionDoc = await MissionModel.findById(
        _id,
        projection,
        options,
      ).exec()

      // If the mission is not found, then resolve with null.
      if (!missionDoc) return resolve(missionDoc)

      // Extract the updated properties.
      let { _id: missionId, ...rest } = updates ?? {}
      // Update every property besides the _id.
      Object.assign(missionDoc, { ...rest })
      // Save the changes.
      missionDoc = await missionDoc.save()

      // Otherwise, resolve with the mission document.
      return resolve(missionDoc)
    } catch (error: any) {
      // Reject the promise with the error.
      return reject(error)
    }
  })
}

/**
 * Ensures that any file references that are null
 * get populated with the proper reference IDs.
 * This is necessary because `null` indicates that
 * the file reference has been deleted, but the ID
 * is still needed for METIS to function properly.
 * @param mission The mission document to process.
 * @throws An error if the recursive query fails to
 * retrieve the necessary data.
 */
const ensureNoNullFiles = async (mission: TMissionDoc) => {
  // Quick scan to see if we even need to re-query
  if (!mission.files || !mission.files.some((f) => f.reference === null)) return

  // Fetch unpopulated file references only
  const unpopulated = await MissionModel.findOne(
    { _id: mission._id },
    { files: 1 },
    { populateFileReferences: false },
  ).lean() // lean gives raw JS object

  if (!unpopulated) {
    throw MetisDatabase.generateValidationError(
      `Failed to find mission document with ID "${mission._id}".`,
    )
  }

  // Create a map of mission-file IDs to their references.
  const idMap = new Map(
    unpopulated.files.map((f) => [f._id.toString(), f.reference]),
  )

  for (let file of mission.files) {
    if (file.reference === null) {
      // Assign retrieved reference IDs to the original
      // document.

      const recoveredRef = idMap.get(file._id.toString())

      if (!recoveredRef) {
        throw MetisDatabase.generateValidationError(
          `Failed to find reference ID for file ${file._id} in mission ${mission.name}`,
        )
      }

      file.reference = recoveredRef
    }
  }
}

/**
 * Validates the alias of a file in a mission.
 * @param value The value to validate.
 * @returns True if valid, false otherwise.
 */
const validate_mission_files_alias = (value: unknown) => {
  return typeof value === 'string' || value === null
}

/* -- SCHEMA SETTERS -- */

/**
 * Sanitizes HTML.
 * @param html The HTML to sanitize.
 * @returns The sanitized HTML.
 */
const sanitizeHtml = (html: string): string => {
  try {
    let sanitizedHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'a',
        'br',
        'p',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'ul',
        'ol',
        'li',
        'code',
        'pre',
        'hr',
        'blockquote',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        's',
        'del',
        'strike',
      ],
      ALLOWED_ATTR: ['href', 'rel', 'target', 'class'],
      FORBID_TAGS: ['script', 'style', 'iframe'],
    })

    return sanitizedHTML
  } catch (error: any) {
    databaseLogger.error('Error sanitizing HTML.\n', error)
    throw new Error('Error sanitizing HTML.')
  }
}

/* -- SCHEMA -- */

/**
 * The schema for a mission in the database.
 */
export const schema = new MissionSchema(
  {
    name: {
      type: String,
      required: true,
      maxLength: ServerMission.MAX_NAME_LENGTH,
    },
    versionNumber: { type: Number, required: true },
    seed: {
      type: String,
      required: true,
      default: StringToolbox.generateRandomId,
    },
    resourceLabel: {
      type: String,
      required: true,
      default: 'Resources',
      maxlength: ServerMission.MAX_RESOURCE_LABEL_LENGTH,
    },
    launchedAt: { type: Date, default: null },
    deleted: { type: Boolean, required: true, default: false },
    structure: {
      type: {},
      required: true,
    },
    prototypes: {
      required: true,
      validate: ServerMission.validatePrototypes,
      type: [
        {
          _id: { type: String, required: true },
          structureKey: { type: String, required: true },
          depthPadding: {
            type: Number,
            required: true,
          },
        },
      ],
    },
    forces: {
      required: true,
      validate: ServerMission.validateForces,
      type: [
        {
          _id: { type: String, required: true },
          introMessage: {
            type: String,
            required: true,
            set: sanitizeHtml,
          },
          name: {
            type: String,
            required: true,
            maxLength: ServerMissionForce.MAX_NAME_LENGTH,
          },
          color: {
            type: String,
            required: true,
          },
          initialResources: {
            type: Number,
            required: true,
          },
          revealAllNodes: {
            type: Boolean,
            required: true,
          },
          localKey: {
            type: String,
            required: true,
          },
          allowNegativeResources: {
            type: Boolean,
            required: true,
          },
          nodes: {
            required: true,
            validate: ServerMissionForce.validateNodes,
            type: [
              {
                _id: { type: String, required: true },
                prototypeId: { type: String, required: true },
                name: {
                  type: String,
                  required: true,
                  maxLength: ServerMissionNode.MAX_NAME_LENGTH,
                },
                color: {
                  type: String,
                  required: true,
                },
                description: {
                  type: String,
                  required: false,
                  default: '',
                  set: sanitizeHtml,
                },
                preExecutionText: {
                  type: String,
                  required: false,
                  default: '',
                  set: sanitizeHtml,
                },
                executable: { type: Boolean, required: true },
                device: { type: Boolean, required: true },
                exclude: { type: Boolean, required: true },
                localKey: {
                  type: String,
                  required: true,
                },
                actions: {
                  required: true,
                  validate: ServerMissionNode.validateActions,
                  type: [
                    {
                      _id: { type: String, required: true },
                      name: {
                        type: String,
                        required: true,
                        maxLength: ServerMissionAction.MAX_NAME_LENGTH,
                      },
                      description: {
                        type: String,
                        required: false,
                        default: '',
                        set: sanitizeHtml,
                      },
                      processTime: {
                        type: Number,
                        required: true,
                      },
                      processTimeHidden: {
                        type: Boolean,
                        required: true,
                      },
                      successChance: {
                        type: Number,
                        required: true,
                      },
                      successChanceHidden: {
                        type: Boolean,
                        required: true,
                      },
                      resourceCost: {
                        type: Number,
                        required: true,
                      },
                      resourceCostHidden: {
                        type: Boolean,
                        required: true,
                      },
                      opensNode: {
                        type: Boolean,
                        required: true,
                      },
                      opensNodeHidden: {
                        type: Boolean,
                        required: true,
                      },
                      postExecutionSuccessText: {
                        type: String,
                        required: false,
                        default: '',
                        set: sanitizeHtml,
                      },
                      postExecutionFailureText: {
                        type: String,
                        required: false,
                        default: '',
                        set: sanitizeHtml,
                      },
                      localKey: {
                        type: String,
                        required: true,
                      },
                      effects: {
                        required: true,
                        validate: ServerMissionAction.validateEffects,
                        type: [
                          {
                            _id: { type: String, required: true },
                            targetId: {
                              type: String,
                              required: true,
                            },
                            environmentId: {
                              type: String,
                              required: true,
                            },
                            targetEnvironmentVersion: {
                              type: String,
                              required: true,
                            },
                            name: {
                              type: String,
                              required: true,
                              maxLength: ServerEffect.MAX_NAME_LENGTH,
                            },
                            trigger: {
                              type: String,
                              required: true,
                            },
                            description: {
                              type: String,
                              required: false,
                              default: '',
                              set: sanitizeHtml,
                            },
                            args: {
                              type: Object,
                              required: true,
                            },
                            localKey: {
                              type: String,
                              required: true,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
    files: {
      type: [
        {
          _id: { type: String, required: true },
          reference: {
            type: Schema.Types.ObjectId,
            ref: 'FileReference',
            required: true,
          },
          alias: {
            type: String,
            validate: validate_mission_files_alias,
            maxLength: Mission.MAX_NAME_LENGTH,
          },
          lastKnownName: {
            type: String,
            maxLength: Mission.MAX_NAME_LENGTH,
          },
          // todo: Add validation to check that the
          // todo: values of the array point to forces
          // todo: present in the mission.
          initialAccess: {
            type: [String],
            required: true,
            default: [],
          },
        },
      ],
    },
  },
  {
    strict: 'throw',
    minimize: false,
    toJSON: {
      transform: toJson,
    },
    toObject: {
      transform: toJson,
    },
    statics: {
      findByIdAndModify,
    },
    timestamps: true,
  },
)

/* -- SCHEMA MIDDLEWARE -- */

// Called before a save is made to the database.
schema.pre<TMissionDoc>('save', function (next) {
  let mission: TMissionSaveJson = this.toJSON()
  ServerMission.validate(mission, next)
  return next()
})

// Called before a find or update is made to the database.
schema.pre<TPreMissionQuery>(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
  function (next) {
    const { populateFileReferences = true } = this.getOptions()

    // Modify the query.
    queryForApiResponse(this)
    // Populate file-references.
    if (populateFileReferences) this.populate('files.reference')
    // Call the next middleware.
    return next()
  },
)

// Converts ObjectIds to strings.
schema.post<TPostMissionQuery>(
  ['find', 'findOne', 'updateOne', 'findOneAndUpdate'],
  async function (missionData: TMissionDoc | TMissionDoc[]) {
    // If the mission is null, then return.
    if (!missionData) return

    // Convert the mission data to an array if it isn't already.
    missionData = !Array.isArray(missionData) ? [missionData] : missionData

    for (let missionDatum of missionData) {
      // Transform the ObjectIds to strings.
      missionDatum._id = missionDatum.id
      // Confirm that no file references are null.
      await ensureNoNullFiles(missionDatum)
    }
  },
)

// Called after a save is made to the database.
schema.post<TMissionDoc>('save', function () {
  // Remove unneeded properties.
  this.set('__v', undefined)
  this.set('deleted', undefined)
})

/* -- MODEL -- */

/**
 * The mongoose model for a mission in the database.
 */
const MissionModel = model<TMission, TMissionModel>('Mission', schema)
export default MissionModel
