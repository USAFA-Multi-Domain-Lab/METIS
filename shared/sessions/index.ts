import User, { IUserJSON } from 'metis/users'

/**
 * The JSON representation of a MetisSession object.
 */
export type TMetisSessionJSON = {
  /**
   * The user with the given session.
   */
  user: IUserJSON
  /**
   * The ID of the game the user has joined, if any.
   */
  gameID: string | null
} | null

export type TMetisSession = {
  /**
   * The user with the given session.
   */
  user: User
  /**
   * The ID of the game the user has joined, if any.
   */
  gameID: string | null
} | null
