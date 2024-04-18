import { TCommonUserJson } from 'metis/users'

/**
 * The JSON representation of a MetisSession object.
 */
export type TMetisSessionJSON = {
  /**
   * The user with the given session.
   */
  user: TCommonUserJson

  /**
   * The ID of the game the user has joined, if any.
   */
  gameId: string | null
} | null

/**
 * Represents a session for a user.
 */
export type TMetisSession<TUser> = {
  /**
   * The user with the given session.
   */
  user: TUser
  /**
   * The ID of the game the user has joined, if any.
   */
  gameId: string | null
} | null
