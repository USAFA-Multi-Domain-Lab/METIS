//npm imports
import express from 'express'
import userModel from '../../../database/models/model-user'
import { StatusError } from '../../../modules/error'
import { User } from '../../../src/modules/users'
import MetisSession from '../../../session/session'

//fields
const router = express.Router()

// -- GET | /session/ --
// Returns the session for the user making the request.
router.get('/session/', (request, response) => {
  // Retrieve the session with the session
  // ID stored in the request.
  let session: MetisSession | undefined = MetisSession.get(
    request.session.userID,
  )

  // If the session was not found, return
  // an empty object.
  if (session === undefined) {
    return response.json(null)
  }
  // Else, convert and return the session
  // as JSON.
  else {
    return response.json(session.toJSON())
  }
})

//post route for authenticating user trying to log in
router.post('/login', (request, response, next) => {
  // Check that the correct fields are present.
  if (request.body.userID && request.body.password) {
    // Authenticate the user with the given
    // userID and password.
    userModel.authenticate(
      request,
      (error: StatusError, correct: boolean, userData: any) => {
        // If there was an error, return the
        // error as a response.
        if (error) {
          return response.sendStatus(error.status ? error.status : 500)
        }
        // Else, check if the username and password
        // were correct.
        else {
          let json: any = { correct, session: null }

          // If correct, generate a new session.
          if (correct) {
            // Create a new user object.
            let user: User = new User(
              userData.userID,
              userData.firstName,
              userData.lastName,
              userData.role,
            )

            try {
              // Attempt to create a new session object.
              let session: MetisSession = new MetisSession(user)

              // Store the session ID in the express
              // session.
              request.session.userID = session.userID

              // Store the session data in the response
              // json.
              json.session = session.toJSON()
            } catch (error) {
              // Session is already created for the given
              // user.
              return response.sendStatus(409)
            }
          }
          return response.json(json)
        }
      },
    )
  } else {
    return response.sendStatus(400)
  }
})

//route for logging out user
router.post('/logout', (request, response, next) => {
  // If session exists.
  if (request.session) {
    // Destroy the METIS session.
    MetisSession.destroy(request.session.userID)

    // Then destroy the Express session.
    request.session.destroy((error) => {
      if (error) {
        return next(error)
      }
      return response.sendStatus(200)
    })
  }
})

module.exports = router
