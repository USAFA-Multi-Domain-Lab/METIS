//npm imports
import express from 'express'
import { ERROR_BAD_DATA } from '../../../database/database'
import UserModel from '../../../database/models/model-user'
import { StatusError } from '../../../modules/error'
import { databaseLogger } from '../../../modules/logging'
import { RequestBodyFilters, defineRequests } from '../../../modules/requests'
import { hasPermittedRole, requireLogin } from '../../../user'

//fields
const router = express.Router()

// -- POST | /api/v1/users/ --
router.post(
  '/',
  requireLogin,
  defineRequests(
    {
      body: {
        user: {
          userID: RequestBodyFilters.STRING_50_CHAR,
          firstName: RequestBodyFilters.STRING_50_CHAR,
          lastName: RequestBodyFilters.STRING_50_CHAR,
          password: RequestBodyFilters.STRING_50_CHAR,
        },
      },
    },
    {
      body: {
        user: {
          role: RequestBodyFilters.STRING_50_CHAR,
        },
      },
    },
  ),
  (request, response) => {
    let body: any = request.body

    let userData: any = body.user

    let userID: any = userData.userID
    let role: any = userData.role
    let firstName: any = userData.firstName
    let lastName: any = userData.lastName
    let password: any = userData.password

    let user = new UserModel({
      userID: userID,
      role: role,
      firstName: firstName,
      lastName: lastName,
      password: password,
    })

    user.save((error: Error) => {
      if (error) {
        databaseLogger.error('Failed to create user:')
        databaseLogger.error(error)

        if (error.name === ERROR_BAD_DATA) {
          return response.sendStatus(400)
        } else {
          return response.sendStatus(500)
        }
      } else {
        databaseLogger.info(`New user created named "${userID}".`)

        // Retrieves newly created user
        // to return in response. This is
        // called again, one to call the
        // queryForApiResponse function,
        // and two, to ensure what's returned
        // is what is in the database.
        UserModel.findOne({ userID: user.userID })
          .queryForApiResponse('findOne')
          .exec((error: Error, user: any) => {
            // If something goes wrong, this is
            // a server issue. If there was something
            // the client did, an error would have
            // already been thrown in the first query.
            if (error || !user) {
              databaseLogger.error('Failed to retrieve newly created user')
              databaseLogger.error(error)
              return response.sendStatus(500)
            } else {
              // Return updated user to the user in the
              // current session.
              return response.send({ user: user })
            }
          })
      }
    })
  },
)

// -- GET | /api/v1/users/ --
// default route that either returns all
// users or a single user based on the
// query parameters
router.get(
  '/',
  defineRequests(
    {
      query: {},
    },
    {
      query: {
        userID: 'string',
      },
    },
  ),
  (request, response) => {
    let userID = request.query.userID

    if (userID === undefined) {
      let queries: any = {}

      UserModel.find({ ...queries }, { password: 0 })
        .queryForApiResponse('find')
        .exec((error: Error, users: any) => {
          if (error !== null || users === null) {
            databaseLogger.error('Failed to retrieve users.')
            databaseLogger.error(error)
            return response.sendStatus(500)
          } else {
            databaseLogger.info('All users retrieved.')
            return response.json({ users: users })
          }
        })
    } else {
      UserModel.findOne({ userID }, { password: 0 })
        .queryForApiResponse('findOne')
        .exec((error: Error, user: any) => {
          if (error !== null) {
            databaseLogger.error(`Failed to retrieve user with ID "${userID}".`)
            databaseLogger.error(error)
            return response.sendStatus(500)
          } else if (user === null) {
            return response.sendStatus(404)
          } else if (!hasPermittedRole(request)) {
            return response.sendStatus(401)
          } else {
            databaseLogger.info(`User with ID "${userID}" retrieved.`)
            return response.json({ user: user })
          }
        })
    }
  },
)

// -- GET | /api/v1/users/session/ --
// Route that looks for the current user in
// the session
router.get('/session', defineRequests({}), (request, response) => {
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

//  -- PUT | /api/v1/users/ --
// This will update the user
router.put(
  '/',
  requireLogin,
  defineRequests(
    {
      body: {
        user: {
          userID: RequestBodyFilters.STRING_50_CHAR,
        },
      },
    },
    {
      body: {
        user: {
          role: RequestBodyFilters.STRING_50_CHAR,
          firstName: RequestBodyFilters.STRING_50_CHAR,
          lastName: RequestBodyFilters.STRING_50_CHAR,
          password: RequestBodyFilters.STRING_50_CHAR,
        },
      },
    },
  ),
  (request, response) => {
    let body: any = request.body

    let userUpdates: any = body.user

    let userID: string = userUpdates.userID

    // Original user is retrieved.
    UserModel.findOne({ userID }).exec((error: Error, user: any) => {
      // Handles errors.
      if (error !== null) {
        databaseLogger.error(`### Failed to retrieve user with ID "${userID}".`)
        databaseLogger.error(error)
        return response.sendStatus(500)
      }
      // Handles user not found.
      else if (user === null) {
        return response.sendStatus(404)
      }
      // Handle proper user retrieval.
      else {
        // Places all values found in
        // userUpdates and puts it in
        // the retrieved mongoose document.
        for (let key in userUpdates) {
          if (key !== '_id' && key !== 'missionID') {
            user[key] = userUpdates[key]
          }
        }

        // Save the updated user.
        user.save((error: Error) => {
          // Handles errors.
          if (error !== null) {
            databaseLogger.error(
              `### Failed to update user with ID "${userID}".`,
            )
            databaseLogger.error(error)

            // If this error was a validation error,
            // then it is a bad request.
            if (error.message.includes('validation failed')) {
              return response.sendStatus(400)
            }
            // Else it's a server error.
            else {
              return response.sendStatus(500)
            }
          }
          // Handles successful save.
          else {
            // Retrieves newly updated user
            // to return in response. This is
            // called again, one to call the
            // queryForApiResponse function,
            // and two, to ensure what's returned
            // is what is in the database.
            UserModel.findOne({ userID })
              .queryForApiResponse('findOne')
              .exec((error: Error, user: any) => {
                // If something goes wrong, this is
                // a server issue. If there was something
                // the client did, an error would have
                // already been thrown in the first query.
                if (error || !user) {
                  databaseLogger.error('Failed to retrieve newly updated user')
                  databaseLogger.error(error)
                  return response.sendStatus(500)
                } else {
                  // Return updated mission to the user.
                  return response.send({ user: user })
                }
              })
          }
        })
      }
    })
  },
)

// -- DELETE | /api/v1/users/ --
// This will delete a user.
router.delete(
  '/',
  requireLogin,
  defineRequests({
    query: {
      userID: 'string',
    },
  }),
  (request, response) => {
    let query: any = request.query

    let userID: any = query.userID

    UserModel.updateOne({ userID: userID }, { deleted: true }, (error: any) => {
      if (error !== null) {
        databaseLogger.error('Failed to delete user:')
        databaseLogger.error(error)
        return response.sendStatus(500)
      } else {
        databaseLogger.info(`Deleted user with the ID "${userID}".`)
        return response.sendStatus(200)
      }
    })
  },
)

// post route for authenticating user trying to log in
router.post(
  '/login',
  defineRequests({
    body: {
      userID: RequestBodyFilters.STRING_50_CHAR,
      password: RequestBodyFilters.STRING_50_CHAR,
    },
  }),
  (request, response, next) => {
    UserModel.authenticate(
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
  },
)

//route for logging out user
router.post('/logout', defineRequests({}), (request, response, next) => {
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
