import User, { TCommonUserJson, TUserOptions } from 'metis/users'

/**
 * Class for managing users on the server.
 * @extends {User}
 */
export default class ServerUser extends User {
  /**
   * @param {TCommonUserJson} data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param {TServerUserOptions} options Options for creating the user.
   */
  public constructor(data: TCommonUserJson, options: TServerUserOptions = {}) {
    // Initialize base properties.
    super(data, options)
  }
}

/* ------------------------------ SERVER USER TYPES ------------------------------ */

/**
 * Options for creating a new Server User object.
 */
export type TServerUserOptions = TUserOptions & {}
