import mongoose, { Schema, Model } from 'mongoose'
import bcrypt from 'bcrypt'
import { StatusError } from '../../modules/error'

const userSchema = new Schema({
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
userSchema.statics.authenticate = (
  request,
  callback: (error: StatusError | null, correct: boolean, user: any) => void,
) => {
  //searches for user based on email provided
  userModel
    .findOne({ userID: request.body.userID })
    .exec((error: Error, user: any) => {
      if (error) {
        return callback(new StatusError(error.message), false, null)
      } else if (!user) {
        return callback(null, false, null)
      }

      //if there is no error and user exists, the encrypted password provided is verified
      bcrypt.compare(
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
    })
}

//before a new user is saved, the password will be encrypted
userSchema.pre('save', function (next) {
  bcrypt.hash(this.password, 10, (error: Error | undefined, hash: string) => {
    if (error) {
      return next(error)
    }
    this.password = hash
    next()
  })
})

const userModel: any = mongoose.model('User', userSchema)

export default userModel
