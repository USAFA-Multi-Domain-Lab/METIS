import User, { TCommonUserJson, TUserOptions } from 'metis/users'
import { TTargetEnvContextUser } from '../target-environments/context-provider'

/**
 * Class for managing users on the server.
 * @extends {User}
 */
export default class ServerUser extends User {
  /**
   * Validates a hashed password.
   * @param password The password to validate.
   * @returns Whether the password is valid.
   */
  public static isValidHashedPassword = (
    password: NonNullable<TCommonUserJson['password']>,
  ): boolean => {
    let passwordExpression: RegExp = /^\$2[ayb]\$.{56}$/
    let isValidPassword: boolean = passwordExpression.test(password)

    return isValidPassword
  }

  /**
   * Extracts the necessary properties from the user to be used as a reference
   * in a target environment.
   * @returns The user's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvContextUser {
    return {
      _id: this._id,
      username: this.username,
    }
  }
}

/* ------------------------------ SERVER USER TYPES ------------------------------ */

/**
 * Options for creating a new Server User object.
 */
export type TServerUserOptions = TUserOptions & {}
