import User, { IUserJSON, IUserOptions } from 'metis/users'
import UserPermission, { IUserPermissionJSON } from 'metis/users/permissions'
import UserRole, { IUserRoleJSON } from 'metis/users/roles'

export type TServerUserOptions = IUserOptions & {}

/**
 * Class for managing users on the server.
 * @extends {User}
 */
export default class ServerUser extends User {
  /**
   * @param {IUserJSON} data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param {TServerUserOptions} options Options for creating the user.
   */
  public constructor(data: IUserJSON, options: TServerUserOptions = {}) {
    // Initialize base properties.
    super(data, options)
  }

  // Implemented abstract method
  protected parseUserRoleData(data: IUserRoleJSON): UserRole {
    return new UserRole(
      data.id,
      UserRole.AVAILABLE_ROLES[data.id].name,
      UserRole.AVAILABLE_ROLES[data.id].description,
      UserRole.AVAILABLE_ROLES[data.id].permissions,
    )
  }

  // Implemented abstract method
  protected parseUserPermissionData(
    data: IUserPermissionJSON[],
  ): UserPermission[] {
    return data.map(
      (datum) =>
        new UserPermission(
          datum.id,
          UserPermission.AVAILABLE_PERMISSIONS[datum.id].name,
          UserPermission.AVAILABLE_PERMISSIONS[datum.id].description,
        ),
    )
  }
}
