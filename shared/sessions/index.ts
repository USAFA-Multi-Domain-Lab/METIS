import { IUserJSON } from 'metis/users'

/**
 * The JSON representation of a MetisSession object.
 */
export type TMetisSessionJSON = {
  user: IUserJSON
  inGame: boolean
} | null

/**
 * Represents a session for a user.
 */
export type TMetisSession<TUser> = {
  user: TUser
  inGame: boolean
} | null
