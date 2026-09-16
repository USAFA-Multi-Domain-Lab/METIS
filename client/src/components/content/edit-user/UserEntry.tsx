import {
  USERNAME_ARCHIVED_ERROR_MESSAGE,
  USERNAME_TAKEN_ERROR_MESSAGE,
  useUserPageContext,
} from '@client/components/pages/UserPage'
import { useGlobalContext } from '@client/context/global'
import { compute } from '@client/toolbox'
import { usePostInitEffect, useRequireLogin } from '@client/toolbox/hooks'
import {
  PASSWORD_FORMAT_MESSAGE,
  PASSWORDS_MUST_MATCH_MESSAGE,
  useUserTextField,
} from '@client/toolbox/hooks/users'
import { ClientUser } from '@client/users/ClientUser'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { UserAccess } from '@shared/users/UserAccess'
import { useRef, useState } from 'react'
import { DetailString } from '../form/DetailString'
import { DetailToggle } from '../form/DetailToggle'
import { DetailDropdown } from '../form/dropdowns/standard/DetailDropdown'
import './UserEntry.scss'

/**
 * This will render the entry form for a user.
 */
export default function UserEntry({
  user,
  handleChange,
  forceUpdate,
}: TUserEntry_P): TReactElement | null {
  const { state } = useUserPageContext()
  const { notify } = useGlobalContext().actions
  const { isAuthorized } = useRequireLogin()

  /* -- STATE -- */

  const [originalUsername] = useState<string>(user.username)
  const [access, setAccess] = useState<UserAccess>(user.access)
  const [needsPasswordReset, setNeedsPasswordReset] = useState<boolean>(
    user.needsPasswordReset,
  )
  const [existsInDatabase] = state.existsInDatabase
  const [usernameError, setUsernameError] = state.usernameError
  const [updatePassword, setUpdatePassword] = state.updatePassword

  /* -- HOOKS -- */

  const username = useUserTextField({
    user,
    property: 'username',
    forceUpdate,
    isValid: (user) => user.hasValidUsername,
    invalidMessage:
      'Usernames must be between 5 and 50 characters long and can only contain letters, numbers, and the following special characters: - _ .',
    onChange: handleChange,
  })
  const firstName = useUserTextField({
    user,
    property: 'firstName',
    forceUpdate,
    isValid: (user) => user.hasValidFirstName,
    invalidMessage:
      'First names must be between 1 and 50 characters long and can only contain letters and the following special characters: -',
    onChange: handleChange,
  })
  const lastName = useUserTextField({
    user,
    property: 'lastName',
    forceUpdate,
    isValid: (user) => user.hasValidLastName,
    invalidMessage:
      'Last names must be between 1 and 50 characters long and can only contain letters and the following special characters: -',
    onChange: handleChange,
  })
  const password = useUserTextField({
    user,
    property: 'password1',
    forceUpdate,
    isValid: (user) => user.hasValidPassword1,
    invalidMessage: PASSWORD_FORMAT_MESSAGE,
    onChange: handleChange,
  })
  const confirmPassword = useUserTextField({
    user,
    property: 'password2',
    forceUpdate,
    isValid: (user) => user.hasValidPassword2,
    invalidMessage: PASSWORD_FORMAT_MESSAGE,
    onChange: handleChange,
  })

  /* -- REFS -- */

  /**
   * Identifies the most recently started username availability check.
   * A check whose identifier no longer matches has been superseded,
   * either by a later check or by the user editing the username, and
   * its result is discarded.
   */
  const latestUsernameCheckId = useRef<number>(0)

  /* -- COMPUTED -- */

  /**
   * The error shown beneath the username field. A problem with the
   * format of the username takes priority over the result of the
   * availability check.
   */
  const usernameErrorDisplayed = compute<string>(
    () => username.errorMessage || usernameError,
  )
  /**
   * The error shown beneath the confirm password field. A problem with
   * the confirmed password itself takes priority over the two passwords
   * not matching.
   */
  const confirmPasswordErrorDisplayed = compute<string>(() => {
    if (StringToolbox.isFilled(confirmPassword.errorMessage)) {
      return confirmPassword.errorMessage
    }

    if (
      StringToolbox.isFilled(confirmPassword.value) &&
      password.value !== confirmPassword.value
    ) {
      return PASSWORDS_MUST_MATCH_MESSAGE
    }

    return ''
  })
  /**
   * The label for the password field.
   */
  const passwordLabel = compute<string>(() =>
    user.needsPasswordReset ? 'Temporary Password' : 'Password',
  )
  /**
   * The label for the confirm password field.
   */
  const confirmPasswordLabel = compute<string>(() =>
    user.needsPasswordReset ? 'Confirm Temporary Password' : 'Confirm Password',
  )
  /**
   * List of accesses to select from.
   */
  const listOfAccesses = compute<UserAccess[]>(() => {
    // Default list of accesses to select from.
    let accesses: UserAccess[] = []

    // If the current user has proper authorization,
    // they are allowed to upsert student users.
    if (isAuthorized('users_write_students')) {
      accesses = [UserAccess.AVAILABLE_ACCESSES.student]
    }

    // If the current user has proper authorization,
    // then they are allowed to upsert users with any
    // access level.
    if (isAuthorized('users_write')) {
      accesses = [
        UserAccess.AVAILABLE_ACCESSES.student,
        UserAccess.AVAILABLE_ACCESSES.instructor,
        UserAccess.AVAILABLE_ACCESSES.admin,
        UserAccess.AVAILABLE_ACCESSES.revokedAccess,
      ]
    }

    return accesses
  })

  /* -- EFFECTS -- */

  // Clear any existing availability error as the username is edited, and
  // retire any check still in flight so its result, which describes the
  // previous username, cannot bring the error back.
  usePostInitEffect(() => {
    setUsernameError('')
    latestUsernameCheckId.current++
  }, [username.value])

  // Sync the component state with the user access property.
  usePostInitEffect(() => {
    user.access = access

    forceUpdate()
    handleChange()
  }, [access])

  // Sync the component state with the user needs password reset property.
  usePostInitEffect(() => {
    user.needsPasswordReset = needsPasswordReset

    forceUpdate()
    handleChange()
  }, [needsPasswordReset])

  /* -- FUNCTIONS -- */

  /**
   * This is called when the username field loses focus.
   * It checks if the username already exists in the database.
   */
  const handleUsernameOnBlur = async (): Promise<void> => {
    // A username that fails format validation already has an error
    // to show, and an unchanged username on the edit form belongs to
    // the user being edited, so neither is worth a lookup.
    let usernameIsUnchanged =
      existsInDatabase && originalUsername === username.value
    if (!user.hasValidUsername || usernameIsUnchanged) return

    // Claim this check, so a result that arrives after a newer check
    // has started can be recognized as out of date and discarded.
    let checkId = ++latestUsernameCheckId.current

    try {
      let result = await ClientUser.$checkUsername(username.value)

      // Discard the result if this check has been superseded.
      if (checkId !== latestUsernameCheckId.current) return

      if (result === 'active') {
        setUsernameError(USERNAME_TAKEN_ERROR_MESSAGE)
      } else if (result === 'archived') {
        setUsernameError(USERNAME_ARCHIVED_ERROR_MESSAGE)
      } else {
        setUsernameError('')
      }
    } catch {
      // The check could not be completed, which is not the same as the
      // username being taken, so tell the user rather than blocking them.
      if (checkId !== latestUsernameCheckId.current) return
      notify('Could not check whether this username is available.', {
        isError: true,
      })
    }
  }

  /* -- RENDER -- */

  return (
    <div className='UserEntry'>
      <DetailString
        fieldType='required'
        label='Username'
        value={username.value}
        setValue={username.setValue}
        errorMessage={usernameErrorDisplayed}
        placeholder='Enter a username here...'
        onBlur={handleUsernameOnBlur}
      />
      <DetailDropdown<UserAccess>
        fieldType='required'
        label='Access Level'
        options={listOfAccesses}
        value={access}
        setValue={setAccess}
        isExpanded={false}
        render={(access: UserAccess) => access.name}
        getKey={({ _id }) => _id}
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: UserAccess.AVAILABLE_ACCESSES.default,
        }}
      />
      <DetailString
        fieldType='required'
        label='First Name'
        value={firstName.value}
        setValue={firstName.setValue}
        errorMessage={firstName.errorMessage}
        placeholder='Enter a first name here...'
      />
      <DetailString
        fieldType='required'
        label='Last Name'
        value={lastName.value}
        setValue={lastName.setValue}
        errorMessage={lastName.errorMessage}
        placeholder='Enter a last name here...'
      />
      {existsInDatabase ? (
        <DetailToggle
          fieldType='required'
          label='Update Password'
          value={updatePassword}
          setValue={setUpdatePassword}
        />
      ) : null}
      <DetailString
        fieldType='required'
        label={passwordLabel}
        value={password.value}
        setValue={password.setValue}
        errorMessage={password.errorMessage}
        inputType='password'
        placeholder='Enter a password here...'
        disabled={!updatePassword && existsInDatabase}
      />
      <DetailString
        fieldType='required'
        label={confirmPasswordLabel}
        value={confirmPassword.value}
        setValue={confirmPassword.setValue}
        errorMessage={confirmPasswordErrorDisplayed}
        inputType='password'
        placeholder='Confirm your password here...'
        disabled={!updatePassword && existsInDatabase}
      />
      <DetailToggle
        fieldType='required'
        label='Needs Password Reset'
        value={needsPasswordReset}
        setValue={setNeedsPasswordReset}
      />
    </div>
  )
}

/* ---------------------------- TYPES FOR USER ENTRY ---------------------------- */

/**
 * Props for `UserEntry` component.
 */
export type TUserEntry_P = {
  /**
   * The user to upsert.
   */
  user: ClientUser
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
  /**
   * Re-renders the user page.
   */
  forceUpdate: () => void
}
