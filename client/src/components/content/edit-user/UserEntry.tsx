import { useUserPageContext } from 'metis/client/components/pages/UserPage'
import { useGlobalContext } from 'metis/client/context/global'
import { compute } from 'metis/client/toolbox'
import { usePostInitEffect, useRequireLogin } from 'metis/client/toolbox/hooks'
import ClientUser from 'metis/client/users'
import UserAccess from 'metis/users/accesses'
import { useEffect, useState } from 'react'
import { DetailString } from '../form/DetailString'
import { DetailToggle } from '../form/DetailToggle'
import { DetailDropdown } from '../form/dropdown'
import If from '../util/If'
import './UserEntry.scss'

/**
 * This will render the entry form for a user.
 */
export default function ({
  user,
  handleChange,
}: TUserEntry_P): TReactElement | null {
  const { state } = useUserPageContext()
  const { forceUpdate } = useGlobalContext().actions
  const { isAuthorized } = useRequireLogin()

  /* -- STATE -- */
  const [handleUsernameError, setHandleUsernameError] =
    useState<THandleOnBlur>('deliverError')
  const [handleFirstNameError, setHandleFirstNameError] =
    useState<THandleOnBlur>('deliverError')
  const [handleLastNameError, setHandleLastNameError] =
    useState<THandleOnBlur>('deliverError')
  const [handlePassword1Error, setHandlePassword1Error] =
    useState<THandleOnBlur>('deliverError')
  const [handlePassword2Error, setHandlePassword2Error] =
    useState<THandleOnBlur>('deliverError')
  const [usernameErrorMessage, setUsernameErrorMessage] = useState<string>()
  const [firstNameErrorMessage, setFirstNameErrorMessage] = useState<string>()
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState<string>()
  const [password1ErrorMessage, setPassword1ErrorMessage] = useState<string>()
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState<string>()
  const [username, setUsername] = useState<string>(user.username)
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
  const [usernameAlreadyExists] = state.usernameAlreadyExists
  const [updatePassword, setUpdatePassword] = state.updatePassword

  /* -- COMPUTED -- */

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
    user.username = username

    if (username !== '' && user.hasValidUsername) {
      removeUserEmptyString('username')
      setHandleUsernameError('none')
      handleChange()
    }

    if (username === '' && !user.hasValidUsername) {
      setHandleUsernameError('deliverError')
      setUserEmptyStringArray([...userEmptyStringArray, `field=username`])
      setUsernameErrorMessage('At least one character is required here.')
    }

    if (username !== '' && !user.hasValidUsername) {
      setHandleUsernameError('deliverError')
      setUsernameErrorMessage(
        'Usernames must be between 5 and 25 characters long and can only contain letters, numbers, and the following special characters: - _ .',
      )
    }

    forceUpdate()
  }, [username])

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
      setHandleFirstNameError('none')
      handleChange()
    }

    if (firstName === '') {
      setHandleFirstNameError('deliverError')
      setFirstNameErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=firstName`])
    }

    if (!user.hasValidFirstName && firstName !== '') {
      setHandleFirstNameError('deliverError')
      setFirstNameErrorMessage(
        'First names must be between 1 and 50 characters long and can only contain letters.',
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
      setHandleLastNameError('none')
      handleChange()
    }

    if (lastName === '') {
      setHandleLastNameError('deliverError')
      setLastNameErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=lastName`])
    }

    if (!user.hasValidLastName && lastName !== '') {
      setHandleLastNameError('deliverError')
      setLastNameErrorMessage(
        'Last names must be between 1 and 50 characters long and can only contain letters.',
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
      setHandlePassword1Error('none')
      handleChange()
    }

    if (password1 === '') {
      setHandlePassword1Error('deliverError')
      setPassword1ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password1`])
    }

    if (!user.hasValidPassword1 && password1 !== '') {
      setHandlePassword1Error('deliverError')
      setPassword1ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    // If the user has entered a password in the second password field,
    // check to see if the two passwords match.
    if (!user.passwordsMatch && user.password2) {
      setHandlePassword2Error('deliverError')
      setPassword2ErrorMessage('Passwords must match.')
    }
    // If the user has entered a password in the second password field
    // and the two passwords match, remove the error.
    else if (user.passwordsMatch && user.password2) {
      setHandlePassword2Error('none')
    }

    forceUpdate()
  }, [password1])

  // Sync the component state with the user password2 property.
  usePostInitEffect(() => {
    user.password2 = password2

    if (user.hasValidPassword2 && password2 !== '') {
      removeUserEmptyString('password2')
      setHandlePassword2Error('none')
      handleChange()
    }

    if (!user.hasValidPassword2 && password2 !== '') {
      setHandlePassword2Error('deliverError')
      setPassword2ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    if (password2 === '') {
      setHandlePassword2Error('deliverError')
      setPassword2ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password2`])
    }

    if (user.hasValidPassword2 && password2 !== '' && !user.passwordsMatch) {
      setHandlePassword2Error('deliverError')
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

  // If the user has entered a username,
  // check to see if it already exists.
  useEffect(() => {
    if (usernameAlreadyExists) {
      setUsernameErrorMessage('Username already exists.')
      setHandleUsernameError('deliverError')
    }
  }, [usernameAlreadyExists])

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

  /* -- RENDER -- */

  return (
    <form
      className='UserEntry'
      onSubmit={(event) => event.preventDefault()}
      autoComplete='off'
    >
      <DetailString
        fieldType='required'
        handleOnBlur={handleUsernameError}
        label='Username'
        value={username}
        setValue={setUsername}
        errorMessage={usernameErrorMessage}
        placeholder='Enter a username here...'
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
        handleOnBlur={handleFirstNameError}
        label='First Name'
        value={firstName}
        setValue={setFirstName}
        errorMessage={firstNameErrorMessage}
        placeholder='Enter a first name here...'
      />
      <DetailString
        fieldType='required'
        handleOnBlur={handleLastNameError}
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
        handleOnBlur={handlePassword1Error}
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
        handleOnBlur={handlePassword2Error}
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

/**
 * The type of handleOnBlur.
 */
type THandleOnBlur = 'deliverError' | 'none'
