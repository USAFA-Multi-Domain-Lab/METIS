import User, { IUserJSON } from 'metis/users'

/**
 * The JSON representation of a MetisSession object.
 */
export type TMetisSessionJSON = {
  user: IUserJSON
  inGame: boolean
} | null

export type TMetisSession = {
  user: User
  inGame: boolean
} | null
