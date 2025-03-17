import { TUserJson } from 'metis/users'

/**
 * The JSON representation of a login object.
 */
export type TLoginJson = {
  /**
   * The user with the given login.
   */
  user: TUserJson

  /**
   * The ID of the session the user has joined, if any.
   */
  sessionId: string | null
} | null

/**
 * Represents the login information for a user.
 */
export type TLogin<TUser> = {
  /**
   * The user with the given login information.
   */
  user: TUser
  /**
   * The ID of the session the user has joined, if any.
   */
  sessionId: string | null
} | null
