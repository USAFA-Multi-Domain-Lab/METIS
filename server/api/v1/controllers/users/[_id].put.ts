import { Request, Response } from 'express-serve-static-core'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ServerLogin from 'metis/server/logins'
import { TUserJson } from 'metis/users'
import ApiResponse from '../../library/response'
import { preventSystemUserWrite } from '../../library/users'

/**
 * This will update a user.
 * @param request The express request.
 * @param response The express response.
 * @returns The updated user in JSON format.
 */
const updateUser = async (request: Request, response: Response) => {
  // Get userId from params and extract updates from the body.
  const userId = request.params._id
  let userUpdates = request.body as Partial<TUserJson>
  // Prevent clients from overriding the _id.
  if (userUpdates._id) delete userUpdates._id
  const { username, accessId } = userUpdates
  const foreignUserLogin = ServerLogin.get(userId)

  // Hash the password if it exists.
  if (!!userUpdates.password) {
    userUpdates.password = await hashPassword(userUpdates.password)
  }

  try {
    // Disable system-user write operations.
    preventSystemUserWrite({ currentUserId: userId, newAccessId: accessId })

    // Check if user exists and if properties changed requiring logout.
    const prevUserData = await UserModel.findById(
      userId,
      {},
      { includeSensitive: true },
    ).exec()
    if (!prevUserData) {
      throw new StatusError(`User with ID "${userId}" not found.`, 404)
    }
    // Only compare fields actually submitted.
    const fieldsToCheck = [
      'username',
      'accessId',
      'password',
      'needsPasswordReset',
      'firstName',
      'lastName',
    ] as const
    const requiresLogout = fieldsToCheck.some(
      (field) =>
        userUpdates[field] !== undefined &&
        prevUserData[field] !== userUpdates[field],
    )

    // Strip undefined values to avoid unintentional unsets.
    const updates = Object.fromEntries(
      Object.entries(userUpdates).filter(([, v]) => v !== undefined),
    ) as Partial<TUserJson>
    // Update the user and return the new doc (using filtered updates).
    const userDoc = await UserModel.findByIdAndModify(
      userId,
      {},
      {
        returnOriginal: false,
        runValidators: true,
      },
      updates,
    )
    // If the user was not found, throw an error.
    if (!userDoc) {
      throw new StatusError(`User with ID "${userId}" not found.`, 404)
    }
    // If the user is required to be logged out, make sure the
    // client is notified so that the user is logged out.
    if (foreignUserLogin && requiresLogout) {
      await ServerLogin.destroy(request, foreignUserLogin.userId)
      foreignUserLogin.client?.emit('logout-user-update', { data: {} })
    }
    // Log the successful update of the user.
    databaseLogger.info(`User with ID "${userId}" updated.`)
    // Return the updated user.
    return ApiResponse.sendJson(response, userDoc)
  } catch (error: any) {
    // Define the user info and error message.
    let userInfo: string = username
      ? `{  _id: "${userId}", name: "${username}" }`
      : `{ _id: "${userId}" }`
    let errorMessage: string = `Failed to update user ${userInfo}.\n`
    // Log the error.
    databaseLogger.error(errorMessage, error)
    // Handle the error.
    return ApiResponse.error(error, response)
  }
}

export default updateUser
