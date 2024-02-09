import mongoose, { Schema } from 'mongoose'
import TargetModel from './targets'
import { TCommonTargetEnvironmentJson } from 'metis/target-environments'

let ObjectId = mongoose.Types.ObjectId

/* -- SCHEMA VALIDATORS -- */

/**
 * Validator for targetEnvironment.id.
 * @param {TCommonTargetEnvironmentJson['id']} id The id to validate.
 * @returns {boolean} Whether the id is valid.
 */
const validate_targetEnvironment_id = (
  id: TCommonTargetEnvironmentJson['id'],
): boolean => {
  // todo: implement validation
  return true
}

/**
 * Validator for targetEnvironment.name.
 * @param {TCommonTargetEnvironmentJson['name']} name The name to validate.
 * @returns {boolean} Whether the name is valid.
 */
const validate_targetEnvironment_name = (
  name: TCommonTargetEnvironmentJson['name'],
): boolean => {
  // todo: implement validation
  return true
}

/**
 * Validator for targetEnvironment.description.
 * @param {TCommonTargetEnvironmentJson['description']} description The description to validate.
 * @returns {boolean} Whether the description is valid.
 */
const validate_targetEnvironment_description = (
  description: TCommonTargetEnvironmentJson['description'],
): boolean => {
  // todo: implement validation
  return true
}

// todo: remove (target-environment)
// /**
//  * Validator for targetEnvironment.host.
//  * @param {TCommonTargetEnvironmentJson['host']} host The host to validate.
//  * @returns {boolean} Whether the host is valid.
//  */
// const validate_targetEnvironment_host = (
//   host: TCommonTargetEnvironmentJson['host'],
// ): boolean => {
//   // todo: implement validation
//   return true
// }

/* -- SCHEMA -- */

const TargetEnvironmentSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      auto: true,
      validate: validate_targetEnvironment_id,
    },
    name: {
      type: String,
      required: true,
      validate: validate_targetEnvironment_name,
    },
    description: {
      type: String,
      required: true,
      validate: validate_targetEnvironment_description,
    },
    // todo: remove (target-environment)
    // host: {
    //   type: String,
    //   required: true,
    //   validate: validate_targetEnvironment_host,
    // },
    targets: {
      type: [TargetModel.schema],
      required: true,
    },
    _id: { type: ObjectId, required: false, auto: true },
  },
  {
    _id: false,
    strict: 'throw',
    minimize: false,
  },
)

/* -- SCHEMA PLUGINS -- */

TargetEnvironmentSchema.plugin((schema) => {
  // This is responsible for removing
  // excess properties from the target
  // environment data that should be
  // hidden from the API and for hiding
  // deleted target environments.
  schema.query.queryForApiResponse = function (
    findFunctionName: 'find' | 'findOne',
  ) {
    // Get projection.
    let projection = this.projection()

    // Create if does not exist.
    if (projection === undefined) {
      projection = {}
    }

    // Remove all unneeded properties.
    if (!('_id' in projection)) {
      projection['_id'] = 0
    }
    if (!('__v' in projection)) {
      projection['__v'] = 0
    }

    // Set projection.
    this.projection(projection)
    // Hide deleted users.
    this.where({ deleted: false })

    // Calls the appropriate find function.
    switch (findFunctionName) {
      case 'find':
        return this.find()
      case 'findOne':
        return this.findOne()
    }
  }
})

/* -- MODEL -- */

const TargetEnvironmentModel: any = mongoose.model(
  'TargetEnvironment',
  TargetEnvironmentSchema,
)

export default TargetEnvironmentModel
