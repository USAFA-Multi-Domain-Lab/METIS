import mongoose, { Schema } from 'mongoose'
import bcryptjs from 'bcryptjs'
import { StatusError } from '../../modules/error'

const UserSchema = new Schema({
  userID: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
})

//authenticates user making a request is in the database
UserSchema.statics.authenticate = (
  request,
  callback: (error: StatusError | null, correct: boolean, user: any) => void,
) => {
  //searches for user based on email provided
  UserModel.findOne({ userID: request.body.userID }).exec(
    (error: Error, user: any) => {
      if (error) {
        return callback(new StatusError(error.message), false, null)
      } else if (!user) {
        return callback(null, false, null)
      }

      //if there is no error and user exists, the encrypted password provided is verified
      bcryptjs.compare(
        request.body.password,
        user.password,
        (error: Error | undefined, same: boolean) => {
          if (error || !user) {
            let error: StatusError = new StatusError(
              'Failed to authenticate user.',
              500,
            )
            callback(error, false, null)
          } else {
            return callback(null, same, same ? user : null)
          }
        },
      )
    },
  )
}

//before a new user is saved, the password will be encrypted
UserSchema.pre('save', function (next) {
  bcryptjs.hash(this.password, 10, (error: Error | undefined, hash: string) => {
    if (error) {
      return next(error)
    }
    this.password = hash
    next()
  })
})

UserSchema.plugin((schema) => {
  // This is responsible for removing
  // excess properties from the mission
  // data that should be hidden from the
  // API and for hidding deleted missions.
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
    if (!('deleted' in projection)) {
      projection['deleted'] = 0
    }
    if (!('_id' in projection)) {
      projection['_id'] = 0
    }
    if (!('__v' in projection)) {
      projection['__v'] = 0
    }

    // Set projection.
    this.projection(projection)
    // Hide deleted missions.
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

const UserModel: any = mongoose.model('User', UserSchema)

export default UserModel
