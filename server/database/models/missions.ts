import DOMPurify from 'isomorphic-dompurify'
import { TMissionSaveJson } from 'metis/missions'
import { databaseLogger } from 'metis/server/logging'
import ServerMission from 'metis/server/missions'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerEffect from 'metis/server/missions/effects'
import ServerMissionForce from 'metis/server/missions/forces'
import ServerMissionNode from 'metis/server/missions/nodes'
import StringToolbox from 'metis/toolbox/strings'
import { model, ProjectionType, QueryOptions } from 'mongoose'
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
export const Schema = new MissionSchema(
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
Schema.pre<TMissionDoc>('save', function (next) {
  let mission: TMissionSaveJson = this.toJSON()
  ServerMission.validate(mission, next)
  return next()
})

// Called before a find or update is made to the database.
Schema.pre<TPreMissionQuery>(
  ['find', 'findOne', 'findOneAndUpdate', 'updateOne'],
  function (next) {
    // Modify the query.
    queryForApiResponse(this)
    // Call the next middleware.
    return next()
  },
)

// Converts ObjectIds to strings.
Schema.post<TPostMissionQuery>(
  ['find', 'findOne', 'updateOne', 'findOneAndUpdate'],
  function (missionData: TMissionDoc | TMissionDoc[]) {
    // If the mission is null, then return.
    if (!missionData) return

    // Convert the mission data to an array if it isn't already.
    missionData = !Array.isArray(missionData) ? [missionData] : missionData

    // Transform the ObjectIds to strings.
    for (let missionDatum of missionData) {
      missionDatum._id = missionDatum.id
    }
  },
)

// Called after a save is made to the database.
Schema.post<TMissionDoc>('save', function () {
  // Remove unneeded properties.
  this.set('__v', undefined)
  this.set('deleted', undefined)
})

/* -- MODEL -- */

/**
 * The mongoose model for a mission in the database.
 */
const MissionModel = model<TMission, TMissionModel>('Mission', Schema)
export default MissionModel
