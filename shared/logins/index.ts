import { TCommonUserJson } from 'metis/users'

/**
 * The JSON representation of a login object.
 */
export type TLoginJson = {
  /**
   * The user with the given login.
   */
  user: TCommonUserJson

  /**
   * The ID of the game the user has joined, if any.
   */
  gameId: string | null
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
   * The ID of the game the user has joined, if any.
   */
  gameId: string | null
} | null
