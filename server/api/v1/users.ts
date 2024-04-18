//npm imports
import { NextFunction, Request, Response } from 'express'
import expressWs from 'express-ws'
import MetisDatabase from 'metis/server/database'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import { auth } from 'metis/server/middleware/users'
import MetisSession from 'metis/server/sessions'
import ServerUser from 'metis/server/users'
import { databaseLogger } from '../../logging'

const routerMap: TMetisRouterMap = (router: expressWs.Router, done) => {
  // -- POST | /api/v1/users/ --
  router.post(
    '/',
    auth({ permissions: ['users_write_students'] }),
    defineRequests({
      body: {
        user: {
          username: RequestBodyFilters.USERNAME,
          roleId: RequestBodyFilters.ROLE,
          expressPermissionIds: RequestBodyFilters.ARRAY,
          firstName: RequestBodyFilters.NAME,
          lastName: RequestBodyFilters.NAME,
          password: RequestBodyFilters.PASSWORD,
          needsPasswordReset: RequestBodyFilters.BOOLEAN,
        },
      },
    }),
    async (request: Request, response: Response) => {
      let { body } = request
      let { user: userData } = body
      let { username, password } = userData

      let session: MetisSession | undefined = MetisSession.get(
        request.session.userId,
      )

      if (password !== undefined) {
        userData.password = await hashPassword(password)
      }

      let user = new UserModel(userData)

      user.save(async (error: Error) => {
        if (error) {
          databaseLogger.error('Failed to create user:')
          databaseLogger.error(error)

          if (error.name === MetisDatabase.ERROR_BAD_DATA) {
            return response.sendStatus(400)
          } else if (error.message.includes('duplicate key error')) {
            return response.sendStatus(409)
          } else {
            return response.sendStatus(500)
          }
        } else {
          databaseLogger.info(`New user created named "${username}".`)

          try {
            // Retrieves newly created user
            // to return in response. This is
            // called again, one to call the
            // queryForUsers function,
            // and two, to ensure what's returned
            // is what is in the database.
            await UserModel.findOne({ _id: user._id })
              .queryForUsers('findOne')
              .queryForFilteredUsers('findOne', session?.user)
              .exec((error: Error, user: any) => {
                // If something goes wrong, this is
                // a server issue. If there was something
                // the client did, an error would have
                // already been thrown.
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
          } catch (error) {
            databaseLogger.error('Failed to retrieve newly created user')
            databaseLogger.error(error)
          }
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
    auth({ permissions: ['users_read_students'] }),
    defineRequests(
      {
        query: {},
      },
      {
        query: {
          _id: 'objectId',
        },
      },
    ),
    async (request: Request, response: Response) => {
      let { query } = request
      let { _id } = query

      let session: MetisSession | undefined = MetisSession.get(
        request.session.userId,
      )

      if (_id === undefined) {
        let queries: any = {}

        try {
          await UserModel.find({ ...queries })
            .queryForUsers('find')
            .queryForFilteredUsers('find', session?.user)
            .exec((error: Error, users: any) => {
              if (error !== null || users === null) {
                databaseLogger.error('Failed to retrieve users.')
                databaseLogger.error(error)
                return response.sendStatus(500)
              } else {
                databaseLogger.info('All users retrieved.')
                return response.json(users)
              }
            })
        } catch (error) {
          databaseLogger.error('Failed to retrieve users.')
          databaseLogger.error(error)
        }
      } else {
        try {
          await UserModel.findOne({ _id: _id })
            .queryForUsers('findOne')
            .queryForFilteredUsers('findOne', session?.user)
            .exec((error: Error, user: any) => {
              if (error !== null) {
                databaseLogger.error(
                  `Failed to retrieve user with ID "${_id}".`,
                )
                databaseLogger.error(error)
                return response.sendStatus(500)
              } else if (user === null) {
                return response.sendStatus(404)
              } else {
                databaseLogger.info(`User with ID "${_id}" retrieved.`)
                return response.json(user)
              }
            })
        } catch (error) {
          databaseLogger.error(`Failed to retrieve user with ID "${_id}".`)
          databaseLogger.error(error)
        }
      }
    },
  )

  // -- GET | /api/v1/users/session/ --
  // Returns the session for the user making the request.
  router.get('/session/', (request: Request, response: Response) => {
    // Retrieve the session with the session
    // ID stored in the request.
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userId,
    )

    // If the session was not found, return
    // an empty object.
    if (session === undefined) {
      return response.json(null)
    }
    // Else, convert and return the session
    // as JSON.
    else {
      return response.json(session.toJson())
    }
  })

  //  -- PUT | /api/v1/users/ --
  // This will update the user
  router.put(
    '/',
    auth({ permissions: ['users_write_students'] }),
    defineRequests(
      {
        body: {
          user: {
            _id: RequestBodyFilters.OBJECTID,
          },
        },
      },
      {
        body: {
          user: {
            username: RequestBodyFilters.USERNAME,
            roleId: RequestBodyFilters.ROLE,
            expressPermissionIds: RequestBodyFilters.ARRAY,
            firstName: RequestBodyFilters.NAME,
            lastName: RequestBodyFilters.NAME,
            password: RequestBodyFilters.PASSWORD,
            needsPasswordReset: RequestBodyFilters.BOOLEAN,
          },
        },
      },
    ),
    async (request: Request, response: Response) => {
      let { body } = request
      let { user: userUpdates } = body
      let { _id, password } = userUpdates

      if (password !== undefined) {
        userUpdates.password = await hashPassword(password)
      }

      let session: MetisSession | undefined = MetisSession.get(
        request.session.userId,
      )

      try {
        // Original user is retrieved.
        await UserModel.findOne({ _id: _id })
          .queryForFilteredUsers('findOne', session?.user)
          .exec((error: Error, user: any) => {
            // Handles errors.
            if (error !== null) {
              databaseLogger.error(
                `### Failed to retrieve user with ID "${_id}".`,
              )
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
                if (key !== '_id') {
                  user[key] = userUpdates[key]
                }
              }

              // Save the updated user.
              user.save(async (error: Error) => {
                // Handles errors.
                if (error !== null) {
                  databaseLogger.error(
                    `### Failed to update user with ID "${_id}".`,
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
                  try {
                    // Retrieves newly updated user
                    // to return in response. This is
                    // called again, one to call the
                    // queryForUsers function,
                    // and two, to ensure what's returned
                    // is what is in the database.
                    await UserModel.findOne({ _id: _id })
                      .queryForUsers('findOne')
                      .queryForFilteredUsers('findOne', session?.user)
                      .exec((error: Error, user: any) => {
                        // If something goes wrong, this is
                        // a server issue. If there was something
                        // the client did, an error would have
                        // already been thrown in the first query.
                        if (error || !user) {
                          databaseLogger.error(
                            'Failed to retrieve newly updated user',
                          )
                          databaseLogger.error(error)
                          return response.sendStatus(500)
                        } else {
                          // Return updated mission to the user.
                          return response.send({ user: user })
                        }
                      })
                  } catch (error) {
                    databaseLogger.error(
                      'Failed to retrieve newly updated user',
                    )
                    databaseLogger.error(error)
                  }
                }
              })
            }
          })
      } catch (error) {
        databaseLogger.error(`Failed to update user with ID "${_id}".`)
        databaseLogger.error(error)
      }
    },
  )

  // -- PUT | /api/v1/users/reset-password --
  // This will reset the user's password
  router.put(
    '/reset-password',
    auth({ permissions: [] }),
    defineRequests({
      body: {
        _id: RequestBodyFilters.OBJECTID,
        password: RequestBodyFilters.PASSWORD,
        needsPasswordReset: RequestBodyFilters.BOOLEAN,
      },
    }),
    async (request: Request, response: Response) => {
      let { body } = request
      let { _id, password } = body

      if (password !== undefined) {
        body.password = await hashPassword(password)
      }

      let session: MetisSession | undefined = MetisSession.get(
        request.session.userId,
      )

      try {
        // Original user is retrieved.
        await UserModel.findOne({ _id: _id }).exec(
          (error: Error, user: any) => {
            // Handles errors.
            if (error !== null) {
              databaseLogger.error(
                `### Failed to retrieve user with ID "${_id}".`,
              )
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
              for (let key in body) {
                if (key !== '_id') {
                  user[key] = body[key]
                }
              }

              // Save the updated user.
              user.save(async (error: Error) => {
                // Handles errors.
                if (error !== null) {
                  databaseLogger.error(
                    `### Failed to update user with ID "${_id}".`,
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
                  try {
                    // Retrieves newly updated user
                    // to return in response. This is
                    // called again, one to call the
                    // queryForUsers function,
                    // and two, to ensure what's returned
                    // is what is in the database.
                    await UserModel.findOne({ _id: _id })
                      .queryForUsers('findOne')
                      .exec((error: Error, user: any) => {
                        // If something goes wrong, this is
                        // a server issue. If there was something
                        // the client did, an error would have
                        // already been thrown in the first query.
                        if (error || !user) {
                          databaseLogger.error(
                            'Failed to retrieve newly updated user',
                          )
                          databaseLogger.error(error)
                          return response.sendStatus(500)
                        } else {
                          // Return updated mission to the user.
                          return response.send({ user: user })
                        }
                      })
                  } catch (error) {
                    databaseLogger.error(
                      'Failed to retrieve newly updated user',
                    )
                    databaseLogger.error(error)
                  }
                }
              })
            }
          },
        )
      } catch (error) {
        databaseLogger.error(`Failed to update user with ID "${_id}".`)
        databaseLogger.error(error)
      }
    },
  )

  // -- DELETE | /api/v1/users/ --
  // This will delete a user.
  router.delete(
    '/',
    auth({ permissions: ['users_write_students'] }),
    defineRequests({
      query: {
        _id: 'objectId',
      },
    }),
    async (request: Request, response: Response) => {
      let { query } = request
      let { _id } = query

      try {
        await UserModel.updateOne({ _id: _id }, { deleted: true })
          .exec()
          .then(() => {
            databaseLogger.info(`Deleted user with the ID "${_id}".`)
            return response.sendStatus(200)
          })
      } catch (error) {
        databaseLogger.error(`Failed to delete user:`)
        databaseLogger.error(error)
        return response.sendStatus(500)
      }
    },
  )

  // post route for authenticating user trying to log in
  router.post(
    '/login',
    defineRequests({
      body: {
        username: RequestBodyFilters.USERNAME,
        password: RequestBodyFilters.PASSWORD,
      },
    }),
    (request: Request, response: Response) => {
      UserModel.authenticate(
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
              let user: ServerUser = new ServerUser(userData)

              try {
                // Attempt to create a new session object.
                let session: MetisSession = new MetisSession(user)

                // Store the session ID in the express
                // session.
                request.session.userId = session.userId

                // Store the session data in the response
                // json.
                json.session = session.toJson()
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
    },
  )

  // route for logging out user
  router.post(
    '/logout',
    (request: Request, response: Response, next: NextFunction) => {
      // If session exists.
      if (request.session) {
        // Destroy the METIS session.
        MetisSession.destroy(request.session.userId)

        // Then destroy the Express session.
        request.session.destroy((error) => {
          if (error) {
            return next(error)
          }
          return response.sendStatus(200)
        })
      }
    },
  )

  done()
}

export default routerMap
