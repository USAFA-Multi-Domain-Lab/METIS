//npm imports
import { Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import MetisDatabase from 'metis/server/database'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { TMetisRouterMap } from 'metis/server/http/router'
import ServerLogin from 'metis/server/logins'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import {
  auth,
  restrictPasswordReset,
  restrictUserManagement,
} from 'metis/server/middleware/users'
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

    let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

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
            .queryForFilteredUsers('findOne', login?.user)
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
                // Return the updated user.
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
    let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

    try {
      await UserModel.find({})
        .queryForUsers('find')
        .queryForFilteredUsers('find', login?.user)
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

    let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

    try {
      await UserModel.findOne({ _id: _id })
        .queryForUsers('findOne')
        .queryForFilteredUsers('findOne', login?.user)
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

    let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

    try {
      // Original user is retrieved.
      await UserModel.findOne({ _id: _id })
        .queryForFilteredUsers('findOne', login?.user)
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
                    .queryForFilteredUsers('findOne', login?.user)
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
          accessId: RequestBodyFilters.ACCESS,
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
            accessId: RequestBodyFilters.ACCESS,
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

  done()
}

export default routerMap
