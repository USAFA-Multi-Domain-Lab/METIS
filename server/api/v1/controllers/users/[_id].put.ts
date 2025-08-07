import { Request, Response } from 'express-serve-static-core'
import UserModel, { hashPassword } from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { databaseLogger } from 'metis/server/logging'
import ServerLogin from 'metis/server/logins'
import { TUserExistingJson, TUserJson } from 'metis/users'
import ApiResponse from '../../library/response'
import { preventSystemUserWrite } from '../../library/users'

/**
 * This will update a user.
 * @param request The express request.
 * @param response The express response.
 * @returns The updated user in JSON format.
 */
const updateUser = async (request: Request, response: Response) => {
  // Extract the user updates from the request body.
  let userUpdates = request.body
  let { _id: userId, username, accessId } = userUpdates as Partial<TUserJson>
  let foreignUserLogin = ServerLogin.get(userId)

  // Hash the password if it exists.
  if (!!userUpdates.password) {
    userUpdates.password = await hashPassword(userUpdates.password)
  }

  try {
    // Disable system-user write operations.
    preventSystemUserWrite({ currentUserId: userId, newAccessId: accessId })

    // Check if user properties changed that require logout
    const prevUserData: TUserExistingJson = await UserModel.findById(
      userId,
      {},
      { includeSensitive: true },
    ).exec()
    const changedFields = [
      { prev: prevUserData.username, new: userUpdates.username },
      { prev: prevUserData.accessId, new: userUpdates.accessId },
      { prev: prevUserData.password, new: userUpdates.password },
      {
        prev: prevUserData.needsPasswordReset,
        new: userUpdates.needsPasswordReset,
      },
    ]
    const requiresLogout = changedFields.some(
      (field) => field.prev !== field.new,
    )

    // Update the user.
    let userDoc: TUserExistingJson = await UserModel.findByIdAndModify(
      userId,
      {},
      {
        returnOriginal: false,
        runValidators: true,
      },
      userUpdates,
    )
    // If the user was not found, throw an error.
    if (userDoc === null) {
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
