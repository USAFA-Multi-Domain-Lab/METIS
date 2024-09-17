import { TCommonUser, TCommonUserJson } from 'metis/users'
import { TBaseOutput, TBaseOutputJson } from '.'

/**
 * The properties needed to display a custom message in the output panel.
 */
export type TCustom = TBaseOutput & {
  /**
   * The type of output.
   */
  type: 'custom'
  /**
   * The username of the user who is the source of the message.
   */
  username: TCommonUser['username']
  /**
   * The message to display in the output panel.
   */
  message: string
}

/**
 * Plain JSON representation of a custom output.
 */
export type TCustomJson = TBaseOutputJson & {
  /**
   * The type of output.
   */
  type: 'custom'
  /**
   * The username of the user who is the source of the message.
   */
  username: TCommonUserJson['username']
  /**
   * The message to display in the output panel.
   */
  message: string
}
