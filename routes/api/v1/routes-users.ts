//npm imports
import express from 'express'
import userModel from '../../../database/models/model-user'
import { StatusError } from '../../../modules/error'
import { User } from '../../../src/modules/users'

//fields
const router = express.Router()

// -- GET | /session/ --
// Returns the session for the user making the request.
router.get('/session/', (request, response) => {
  let session = request.session

  console.log(request.session.user)

  return response.json({
    user: session.user ? session.user.toJSON() : undefined,
    missionSession: session.missionSession
      ? session.missionSession.toJSON()
      : undefined,
  })
})

//post route for authenticating user trying to log in
router.post('/login', (request, response, next) => {
  if (request.body.userID && request.body.password) {
    userModel.authenticate(
      request,
      (error: StatusError, correct: boolean, user: any) => {
        if (error) {
          return response.sendStatus(error.status ? error.status : 500)
        } else {
          if (correct) {
            request.session.user = new User(
              user.userID,
              user.firstName,
              user.lastName,
              user.role,
            )
          }
          return response.json({
            user: request.session.user
              ? request.session.user.toJSON()
              : undefined,
            missionSession: request.session.missionSession
              ? request.session.missionSession.toJSON()
              : undefined,
            correct,
          })
        }
      },
    )
  } else {
    return response.sendStatus(400)
  }
})

//route for logging out user
router.post('/logout', (request, response, next) => {
  if (request.session) {
    request.session.destroy((error) => {
      if (error) {
        return next(error)
      }
      return response.sendStatus(200)
    })
  }
})

module.exports = router
