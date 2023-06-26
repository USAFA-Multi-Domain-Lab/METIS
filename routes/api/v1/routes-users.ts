//npm imports
import express from 'express'
import userModel from '../../../database/models/model-user'
import { StatusError } from '../../../modules/error'

//fields
const router = express.Router()

// -- GET | / --
// default route that looks for the  current user in
// the session
router.get('/', (request, response) => {
  let userID: string | undefined = request.session.userID
  let role: string | undefined = request.session.role

  if (userID !== undefined && role !== undefined) {
    return response.json({
      currentUser: { userID, role },
    })
  } else {
    return response.json({
      currentUser: null,
    })
  }
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
            request.session.userID = user.userID
            request.session.role = user.role
          }
          return response.json({
            currentUser: user,
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
