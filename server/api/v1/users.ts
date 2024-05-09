//npm imports
import { NextFunction, Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import MetisDatabase from 'metis/server/database'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { TMetisRouterMap } from 'metis/server/http/router'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import {
  auth,
  restrictPasswordReset,
  restrictUserManagement,
} from 'metis/server/middleware/users'
import MetisSession from 'metis/server/sessions'
import ServerUser from 'metis/server/users'
import { databaseLogger } from '../../logging'

const routerMap: TMetisRouterMap = (router: expressWs.Router, done) => {
  /* ---------------------------- CREATE ---------------------------- */

  /**
   * This will create a new user.
   * @returns The newly created user in JSON format.
   */
  const createNewUser = async (request: Request, response: Response) => {
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
  }

  /* ---------------------------- READ ---------------------------- */

  /**
   * This will retrieve all users.
   * @returns The users in JSON format.
   */
  const getUsers = async (request: Request, response: Response) => {
    let session: MetisSession | undefined = MetisSession.get(
      request.session.userId,
    )

    try {
      await UserModel.find({})
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
  }

  /**
   * This will retrieve a specific user.
   * @returns The user in JSON format.
   */
  const getUser = async (request: Request, response: Response) => {
    let { params } = request
    let { _id } = params

    let session: MetisSession | undefined = MetisSession.get(
      request.session.userId,
    )

    try {
      await UserModel.findOne({ _id: _id })
        .queryForUsers('findOne')
        .queryForFilteredUsers('findOne', session?.user)
        .exec((error: Error, user: any) => {
          if (error !== null) {
            databaseLogger.error(`Failed to retrieve user with ID "${_id}".`)
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

  /**
   * This will return the session for the user making the request.
   * @returns The session in JSON format or null if the session was not found.
   */
  const getSession = (request: Request, response: Response) => {
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
  }

  /* ---------------------------- UPDATE ---------------------------- */

  /**
   * This will update a user.
   * @returns The updated user in JSON format.
   */
  const updateUser = async (request: Request, response: Response) => {
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
                        // Return the updated user to the client.
                        return response.send({ user: user })
                      }
                    })
                } catch (error) {
                  databaseLogger.error('Failed to retrieve newly updated user')
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
  }

  /**
   * This will reset the user's password.
   * @returns The updated user in JSON format.
   */
  const resetPassword = async (request: Request, response: Response) => {
    let { body } = request
    let { _id, password } = body

    if (password !== undefined) {
      body.password = await hashPassword(password)
    }

    try {
      // Original user is retrieved.
      await UserModel.findOne({ _id: _id }).exec((error: Error, user: any) => {
        // Handles errors.
        if (error !== null) {
          databaseLogger.error(`### Failed to retrieve user with ID "${_id}".`)
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
                      // Return the updated user to the client.
                      return response.send({ user: user })
                    }
                  })
              } catch (error) {
                databaseLogger.error('Failed to retrieve newly updated user')
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
  }

  /* ---------------------------- DELETE ---------------------------- */

  /**
   * This will delete a user.
   * @returns 200 response if the user was deleted successfully.
   */
  const deleteUser = async (request: Request, response: Response) => {
    let { params } = request
    let { _id } = params

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
  }

  /* ---------------------------- AUTH ---------------------------- */

  /**
   * This will log the user in.
   * @returns The session in JSON format.
   */
  const login = (request: Request, response: Response) => {
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
  }

  /**
   * This will log the user out.
   * @returns 200 response if the user was logged out successfully.
   */
  const logout = (request: Request, response: Response, next: NextFunction) => {
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
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- POST | /api/v1/users/ --
  router.post(
    '/',
    auth({ permissions: ['users_write_students'] }),
    restrictUserManagement,
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
    createNewUser,
  )

  // -- GET | /api/v1/users/session/ --
  router.get('/session/', getSession)

  // -- GET | /api/v1/users/ --
  router.get('/', auth({ permissions: ['users_read_students'] }), getUsers)

  // -- GET | /api/v1/users/:_id/ --
  router.get(
    '/:_id/',
    auth({ permissions: ['users_read_students'] }),
    defineRequests({ params: { _id: 'objectId' } }),
    getUser,
  )

  //  -- PUT | /api/v1/users/ --
  router.put(
    '/',
    auth({ permissions: ['users_write_students'] }),
    restrictUserManagement,
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
    updateUser,
  )

  // -- PUT | /api/v1/users/reset-password --
  router.put(
    '/reset-password',
    auth({}),
    restrictPasswordReset,
    defineRequests({
      body: {
        _id: RequestBodyFilters.OBJECTID,
        password: RequestBodyFilters.PASSWORD,
        needsPasswordReset: RequestBodyFilters.BOOLEAN,
      },
    }),
    resetPassword,
  )

  // -- DELETE | /api/v1/users/:_id/ --
  router.delete(
    '/:_id/',
    auth({ permissions: ['users_write_students'] }),
    restrictUserManagement,
    defineRequests({
      params: {
        _id: 'objectId',
      },
    }),
    deleteUser,
  )

  // -- POST | /api/v1/users/login/ --
  router.post(
    '/login',
    defineRequests({
      body: {
        username: RequestBodyFilters.USERNAME,
        password: RequestBodyFilters.PASSWORD,
      },
    }),
    login,
  )

  // -- POST | /api/v1/users/logout/ --
  router.post('/logout', logout)

  done()
}

export default routerMap
