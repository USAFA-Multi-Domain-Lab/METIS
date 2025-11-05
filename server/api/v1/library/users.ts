import { UserModel } from '../../../database'
import { StatusError } from './StatusError'

/**
 * Middleware which prevents system users from being modified
 * or created via the API and non-system user from becoming
 * system users.
 * @param options Options to provide as context to the middleware.
 */
export async function preventSystemUserWrite({
  currentUserId,
  newAccessId,
}: TPreventSystemUserWriteOptions): Promise<void> {
  // Define two checks, whether a current user with
  // system access is being modified, or if a user
  // is being created or updated to have system access.
  let modifyingSystemUser = false
  let assingingSystemAccess = newAccessId === 'system'

  // If a current user ID is provided, query the database
  // to check if that user is a system user.
  if (currentUserId) {
    modifyingSystemUser = Boolean(
      await UserModel.exists({ _id: currentUserId, accessId: 'system' }),
    )
  }

  // Confirm that an illegal operation is not being
  // attempted, throwing an error if so.
  if (modifyingSystemUser) {
    throw new StatusError(
      "Users with 'system' access cannot be updated via the API.",
      403,
    )
  }
  if (assingingSystemAccess) {
    throw new StatusError(
      "Users cannot be assigned 'system' access via the API.",
      403,
    )
  }
}

/**
 * Options for {@link preventSystemUserWrite}.
 */
export interface TPreventSystemUserWriteOptions {
  /**
   * The ID of an existing user that is being updated.
   * If this is passed, the middleware will confirm that
   * the given user is not a current system user.
   */
  currentUserId?: string
  /**
   * The ID of new or existing user that is having this
   * access ID assigned to it, whether via creation or
   * an update. If this is passed, the middleware will
   * confirm that a user is not being created or updated
   * with the `'system'` access ID.
   */
  newAccessId?: string
}
