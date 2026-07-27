import {
  USERNAME_ARCHIVED_ERROR_MESSAGE,
  USERNAME_TAKEN_ERROR_MESSAGE,
  useUserPageContext,
} from '@client/components/pages/UserPage'
import { useGlobalContext } from '@client/context/global'
import { compute } from '@client/toolbox'
import { usePostInitEffect, useRequireLogin } from '@client/toolbox/hooks'
import { ClientUser } from '@client/users/ClientUser'
import { UserAccess } from '@shared/users/UserAccess'
import { useRef, useState } from 'react'
import { DetailString } from '../form/DetailString'
import { DetailToggle } from '../form/DetailToggle'
import { DetailDropdown } from '../form/dropdowns/standard/DetailDropdown'
import If from '../util/If'
import './UserEntry.scss'

/**
 * This will render the entry form for a user.
 */
export default function UserEntry({
  user,
  handleChange,
}: TUserEntry_P): TReactElement | null {
  const { state } = useUserPageContext()
  const { forceUpdate, notify } = useGlobalContext().actions
  const { isAuthorized } = useRequireLogin()

  /* -- STATE -- */
  const [usernameErrorMessage, setUsernameErrorMessage] = useState<string>()
  const [firstNameErrorMessage, setFirstNameErrorMessage] = useState<string>()
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState<string>()
  const [password1ErrorMessage, setPassword1ErrorMessage] = useState<string>()
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState<string>()
  const [currentUsername, setCurrentUsername] = useState<string>(user.username)
  const [originalUsername] = useState<string>(user.username)
  const [access, setAccess] = useState<UserAccess>(user.access)
  const [firstName, setFirstName] = useState<string>(user.firstName)
  const [lastName, setLastName] = useState<string>(user.lastName)
  const [password1, setPassword1] = useState<string>(user.password1 ?? '')
  const [password2, setPassword2] = useState<string>(user.password2 ?? '')
  const [needsPasswordReset, setNeedsPasswordReset] = useState<boolean>(
    user.needsPasswordReset,
  )
  const [existsInDatabase] = state.existsInDatabase
  const [userEmptyStringArray, setUserEmptyStringArray] =
    state.userEmptyStringArray
  const [usernameError, setUsernameError] = state.usernameError
  const [updatePassword, setUpdatePassword] = state.updatePassword

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
  const usernameErrorDisplayed: string = compute(
    () => usernameErrorMessage || usernameError,
  )
  /**
   * The label for the password field.
   */
  const passwordLabel: string = compute(() =>
    user.needsPasswordReset ? 'Temporary Password' : 'Password',
  )
  /**
   * The label for the confirm password field.
   */
  const confirmPasswordLabel: string = compute(() =>
    user.needsPasswordReset ? 'Confirm Temporary Password' : 'Confirm Password',
  )
  /**
   * List of accesses to select from.
   */
  const listOfAccesses: UserAccess[] = compute(() => {
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

  // Sync the component state with the username property.
  usePostInitEffect(() => {
    user.username = currentUsername

    // Clear any existing availability error as the user types, and
    // retire any check still in flight so its result, which describes
    // the previous username, cannot bring the error back.
    setUsernameError('')
    latestUsernameCheckId.current++

    if (currentUsername !== '' && user.hasValidUsername) {
      removeUserEmptyString('username')
      setUsernameErrorMessage('')
      handleChange()
    }

    if (currentUsername === '' && !user.hasValidUsername) {
      setUserEmptyStringArray([...userEmptyStringArray, `field=username`])
      setUsernameErrorMessage('At least one character is required here.')
    }

    if (currentUsername !== '' && !user.hasValidUsername) {
      setUsernameErrorMessage(
        'Usernames must be between 5 and 50 characters long and can only contain letters, numbers, and the following special characters: - _ .',
      )
    }

    forceUpdate()
  }, [currentUsername])

  // Sync the component state with the user access property.
  usePostInitEffect(() => {
    user.access = access

    forceUpdate()
    handleChange()
  }, [access])

  // Sync the component state with the user first name property.
  usePostInitEffect(() => {
    user.firstName = firstName

    if (firstName !== '' && user.hasValidFirstName) {
      removeUserEmptyString('firstName')
      setFirstNameErrorMessage('')
      handleChange()
    }

    if (firstName === '') {
      setFirstNameErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=firstName`])
    }

    if (!user.hasValidFirstName && firstName !== '') {
      setFirstNameErrorMessage(
        'First names must be between 1 and 50 characters long and can only contain letters and the following special characters: -',
      )
      setUserEmptyStringArray([...userEmptyStringArray, `field=firstName`])
    }

    forceUpdate()
  }, [firstName])

  // Sync the component state with the user last name property.
  usePostInitEffect(() => {
    user.lastName = lastName

    if (lastName !== '' && user.hasValidLastName) {
      removeUserEmptyString('lastName')
      setLastNameErrorMessage('')
      handleChange()
    }

    if (lastName === '') {
      setLastNameErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=lastName`])
    }

    if (!user.hasValidLastName && lastName !== '') {
      setLastNameErrorMessage(
        'Last names must be between 1 and 50 characters long and can only contain letters and the following special characters: -',
      )
      setUserEmptyStringArray([...userEmptyStringArray, `field=lastName`])
    }

    forceUpdate()
  }, [lastName])

  // Sync the component state with the user password1 property.
  usePostInitEffect(() => {
    user.password1 = password1

    if (user.hasValidPassword1 && password1 !== '') {
      removeUserEmptyString('password1')
      setPassword1ErrorMessage('')
      handleChange()
    }

    if (password1 === '') {
      setPassword1ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password1`])
    }

    if (!user.hasValidPassword1 && password1 !== '') {
      setPassword1ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    // If the user has entered a password in the second password field,
    // check to see if the two passwords match.
    if (!user.passwordsMatch && user.password2) {
      setPassword2ErrorMessage('Passwords must match.')
    }
    // If the user has entered a password in the second password field
    // and the two passwords match, remove the error.
    else if (user.passwordsMatch && user.password2) {
      setPassword2ErrorMessage('')
    }

    forceUpdate()
  }, [password1])

  // Sync the component state with the user password2 property.
  usePostInitEffect(() => {
    user.password2 = password2

    if (user.hasValidPassword2 && password2 !== '') {
      removeUserEmptyString('password2')
      setPassword2ErrorMessage('')
      handleChange()
    }

    if (!user.hasValidPassword2 && password2 !== '') {
      setPassword2ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    if (password2 === '') {
      setPassword2ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password2`])
    }

    if (user.hasValidPassword2 && password2 !== '' && !user.passwordsMatch) {
      setPassword2ErrorMessage('Passwords must match.')
    }

    forceUpdate()
  }, [password2])

  // Sync the component state with the user needs password reset property.
  usePostInitEffect(() => {
    user.needsPasswordReset = needsPasswordReset
    forceUpdate()
    handleChange()
  }, [needsPasswordReset])

  /* -- FUNCTIONS -- */

  /**
   * This is called to remove a field from the userEmptyStringArray.
   */
  const removeUserEmptyString = (field: string) => {
    userEmptyStringArray.map((userEmptyString: string, index: number) => {
      if (userEmptyString === `field=${field}`) {
        userEmptyStringArray.splice(index, 1)
      }
    })
  }

  /**
   * This is called when the username field loses focus.
   * It checks if the username already exists in the database.
   */
  const handleUsernameOnBlur = async (): Promise<void> => {
    // A username that fails format validation already has an error
    // to show, and an unchanged username on the edit form belongs to
    // the user being edited, so neither is worth a lookup.
    let usernameIsUnchanged =
      existsInDatabase && originalUsername === currentUsername
    if (!user.hasValidUsername || usernameIsUnchanged) return

    // Claim this check, so a result that arrives after a newer check
    // has started can be recognized as out of date and discarded.
    let checkId = ++latestUsernameCheckId.current

    try {
      let result = await ClientUser.$checkUsername(currentUsername)

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
    <form
      className='UserEntry'
      onSubmit={(event) => event.preventDefault()}
      autoComplete='off'
    >
      <DetailString
        fieldType='required'
        label='Username'
        value={currentUsername}
        setValue={setCurrentUsername}
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
        value={firstName}
        setValue={setFirstName}
        errorMessage={firstNameErrorMessage}
        placeholder='Enter a first name here...'
      />
      <DetailString
        fieldType='required'
        label='Last Name'
        value={lastName}
        setValue={setLastName}
        errorMessage={lastNameErrorMessage}
        placeholder='Enter a last name here...'
      />
      <If condition={existsInDatabase}>
        <DetailToggle
          fieldType='required'
          label='Update Password'
          value={updatePassword}
          setValue={setUpdatePassword}
        />
      </If>
      <DetailString
        fieldType='required'
        label={passwordLabel}
        value={password1}
        setValue={setPassword1}
        errorMessage={password1ErrorMessage}
        inputType='password'
        placeholder='Enter a password here...'
        disabled={!updatePassword && existsInDatabase}
      />
      <DetailString
        fieldType='required'
        label={confirmPasswordLabel}
        value={password2}
        setValue={setPassword2}
        errorMessage={password2ErrorMessage}
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
    </form>
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
}
