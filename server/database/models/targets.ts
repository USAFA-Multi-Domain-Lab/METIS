import { TCommonTargetJson } from 'metis/target-environments/targets'
import mongoose, { Schema } from 'mongoose'

let ObjectId = mongoose.Types.ObjectId

/* -- SCHEMA VALIDATORS -- */

/**
 * Validator for target.id.
 * @param {TCommonTargetJson['id']} id The id to validate.
 * @returns {boolean} Whether the id is valid.
 */
const validate_target_id = (id: TCommonTargetJson['id']): boolean => {
  // todo: implement validation
  return true
}

/**
 * Validator for target.name.
 * @param {TCommonTargetJson['name']} name The name to validate.
 * @returns {boolean} Whether the name is valid.
 */
const validate_target_name = (name: TCommonTargetJson['name']): boolean => {
  // todo: implement validation
  return true
}

/**
 * Validator for target.description.
 * @param {string} description The description to validate.
 * @returns {boolean} Whether the description is valid.
 */
const validate_target_description = (
  description: TCommonTargetJson['description'],
): boolean => {
  // todo: implement validation
  return true
}

/* -- SCHEMA -- */

const TargetSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      auto: true,
      validate: validate_target_id,
    },
    name: {
      type: String,
      required: true,
      validate: validate_target_name,
    },
    description: {
      type: String,
      required: true,
      validate: validate_target_description,
    },
    // options: {
    //   type: [{}],
    //   required: true,
    // },
    _id: { type: ObjectId, required: false, auto: true },
  },
  {
    _id: false,
    strict: 'throw',
    minimize: false,
  },
)

/* -- SCHEMA PLUGINS -- */

TargetSchema.plugin((schema) => {
  // This is responsible for removing
  // excess properties from the target
  // data that should be hidden from
  // the API and for hiding deleted
  // target environments.
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

const TargetModel: any = mongoose.model('Target', TargetSchema)

export default TargetModel
