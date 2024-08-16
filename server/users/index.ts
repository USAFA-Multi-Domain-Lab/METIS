import User, { TCommonUserJson, TUserOptions } from 'metis/users'

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
}

/* ------------------------------ SERVER USER TYPES ------------------------------ */

/**
 * Options for creating a new Server User object.
 */
export type TServerUserOptions = TUserOptions & {}
