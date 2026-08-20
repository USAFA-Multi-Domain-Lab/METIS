import { useGlobalContext } from '@client/context/global'
import type { ClientUser } from '@client/users/ClientUser'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useState } from 'react'
import { usePostInitEffect } from '.'

/**
 * Shown when a password does not meet the format the application requires.
 */
export const PASSWORD_FORMAT_MESSAGE: string =
  'Password must be between 8 and 50 characters and cannot contain spaces.'

/**
 * Shown when the two password fields of a form hold different passwords.
 */
export const PASSWORDS_MUST_MATCH_MESSAGE: string = 'Passwords must match.'

/**
 * Keeps one text field of a user in step with the form it is shown in. The
 * hook owns the value the field displays, writes that value onto the user object
 * as it changes, and reports what the input value gets wrong.
 *
 * @note The property on the user is only written once the field has been
 * edited, never on the first render. That matters for the password
 * properties: the server never sends a password to the client, so they
 * arrive undefined, and an untouched password field has to leave them that
 * way. An empty string reads as a password the user cleared deliberately,
 * which stops the user from being saved.
 * @param options @see {@link TUserTextField_P}
 * @returns The value to display, the setter to hand to the field, and the
 * message describing what is wrong with the value.
 */
export function useUserTextField({
  user,
  property,
  isValid = () => true,
  invalidMessage = '',
  onChange = () => {},
}: TUserTextField_P): TUserTextField {
  const { forceUpdate } = useGlobalContext().actions
  const [value, setValue] = useState<string>(user[property] ?? '')
  const [errorMessage, setErrorMessage] = useState<string>('')

  /* -- EFFECTS -- */

  // Put the value on the user and work out what, if anything, is wrong
  // with it. Skipping the first render is what leaves an untouched
  // property alone.
  usePostInitEffect(() => {
    user[property] = value

    // A blank field is left to the detail component, which has its own
    // message for a required field with nothing entered in it.
    if (!StringToolbox.isFilled(value)) {
      setErrorMessage('')
    } else if (isValid(user)) {
      setErrorMessage('')
      onChange()
    } else {
      setErrorMessage(invalidMessage)
    }

    forceUpdate()
  }, [value])

  return { value, setValue, errorMessage }
}

/* -- TYPES -- */

/**
 * The properties of a user that are edited through a text field.
 */
export type TUserTextProperty =
  | 'username'
  | 'firstName'
  | 'lastName'
  | 'password1'
  | 'password2'

/**
 * Options for {@link useUserTextField}.
 */
export type TUserTextField_P = {
  /**
   * The user being edited.
   */
  user: ClientUser
  /**
   * The property of the user that the field edits.
   */
  property: TUserTextProperty
  /**
   * Whether the value now held by the user is acceptable.
   * @default () => true
   */
  isValid?: (user: ClientUser) => boolean
  /**
   * The message shown when the value is not acceptable.
   * @note A field left blank is not covered by this, as
   * the detail component reports that itself.
   * @default ''
   */
  invalidMessage?: string
  /**
   * Called whenever the field is given an acceptable value.
   * @default () => {}
   */
  onChange?: () => void
}

/**
 * What {@link useUserTextField} hands back for a single field.
 */
export type TUserTextField = {
  /**
   * The value to display in the field.
   */
  value: string
  /**
   * The setter to hand to the field.
   */
  setValue: TReactSetter<string>
  /**
   * The message describing what is wrong with the value, or an empty
   * string when there is nothing to report.
   */
  errorMessage: string
}
