import { useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { ReactSetter } from 'src/toolbox/types'
import ClientUser from 'src/users'
import { TMetisSession } from '../../../../../shared/sessions'
import UserRole from '../../../../../shared/users/roles'
import { DetailDropDown, DetailString, DetailToggle } from '../form/Form'
import './CreateUserEntry.scss'

/**
 * This will render the form for creating a new user.
 */
export default function CreateUserEntry({
  user,
  userEmptyStringArray,
  usernameAlreadyExists,
  session,
  setUserEmptyStringArray,
  handleChange,
}: TCreateUserEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

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
  const [role, setRole] = useState<UserRole>(user.role)
  const [firstName, setFirstName] = useState<string>(user.firstName)
  const [lastName, setLastName] = useState<string>(user.lastName)
  const [password1, setPassword1] = useState<string>(user.password1 || '')
  const [password2, setPassword2] = useState<string>(user.password2 || '')
  const [needsPasswordReset, setNeedsPasswordReset] = useState<boolean>(
    user.needsPasswordReset,
  )

  /* -- COMPUTED -- */

  /**
   * The current user in session.
   */
  const currentUser: ClientUser = compute(() => session.user)
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
   * List of roles to select from.
   */
  const listOfRoles: UserRole[] = compute(() => {
    // Default list of roles to select from.
    let roles: UserRole[] = []

    // If the current user in session has
    // proper authorization, they are allowed
    // to create students.
    if (currentUser.isAuthorized('users_write_students')) {
      roles = [UserRole.AVAILABLE_ROLES.student]
    }

    // If the current user in session has
    // proper authorization, then they are
    // allowed to create users with any role.
    if (currentUser.isAuthorized('users_write')) {
      roles = [
        UserRole.AVAILABLE_ROLES.student,
        UserRole.AVAILABLE_ROLES.instructor,
        UserRole.AVAILABLE_ROLES.admin,
        UserRole.AVAILABLE_ROLES.revokedAccess,
      ]
    }

    return roles
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

  // Sync the component state with the user role property.
  usePostInitEffect(() => {
    user.role = role

    forceUpdate()
    handleChange()
  }, [role])

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
      className='CreateUserEntry'
      onSubmit={(event) => event.preventDefault()}
      autoComplete='off'
    >
      <DetailString
        fieldType='required'
        handleOnBlur={handleUsernameError}
        label='Username'
        stateValue={username}
        setState={setUsername}
        errorMessage={usernameErrorMessage}
        placeholder='Enter a username here...'
      />
      <DetailDropDown<UserRole>
        fieldType='required'
        label='Role'
        options={listOfRoles}
        stateValue={role}
        setState={setRole}
        isExpanded={false}
        renderDisplayName={(role: UserRole) => role.name}
      />
      <DetailString
        fieldType='required'
        handleOnBlur={handleFirstNameError}
        label='First Name'
        stateValue={firstName}
        setState={setFirstName}
        errorMessage={firstNameErrorMessage}
        placeholder='Enter a first name here...'
      />
      <DetailString
        fieldType='required'
        handleOnBlur={handleLastNameError}
        label='Last Name'
        stateValue={lastName}
        setState={setLastName}
        errorMessage={lastNameErrorMessage}
        placeholder='Enter a last name here...'
      />
      <DetailString
        fieldType='required'
        handleOnBlur={handlePassword1Error}
        label={passwordLabel}
        stateValue={password1}
        setState={setPassword1}
        errorMessage={password1ErrorMessage}
        inputType='password'
        placeholder='Enter a password here...'
      />

      <DetailString
        fieldType='required'
        handleOnBlur={handlePassword2Error}
        label={confirmPasswordLabel}
        stateValue={password2}
        setState={setPassword2}
        errorMessage={password2ErrorMessage}
        inputType='password'
        placeholder='Confirm your password here...'
      />
      <DetailToggle
        fieldType='required'
        label='Needs Password Reset'
        stateValue={needsPasswordReset}
        setState={setNeedsPasswordReset}
      />
    </form>
  )
}

/* ---------------------------- TYPES FOR CREATE USER ENTRY ---------------------------- */

/**
 * Props for CreateUserEntry component.
 */
export type TCreateUserEntry_P = {
  /**
   * The user to be created.
   */
  user: ClientUser
  /**
   * An array of fields with empty strings.
   */
  userEmptyStringArray: string[]
  /**
   * Whether or not the username already exists.
   */
  usernameAlreadyExists: boolean
  /**
   * The session for the user.
   */
  session: NonNullable<TMetisSession<ClientUser>>
  /**
   * A function that will update the array of fields with empty strings.
   */
  setUserEmptyStringArray: ReactSetter<string[]>
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}

/**
 * The type of handleOnBlur.
 */
type THandleOnBlur = 'deliverError' | 'none'
