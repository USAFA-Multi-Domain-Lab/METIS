import { useEffect, useState } from 'react'
import { Detail, DetailDropDown } from '../form/Form'
import Toggle from '../user-controls/Toggle'
import './CreateUserEntry.scss'
import ClientUser from 'src/users'
import UserRole from '../../../../../shared/users/roles'
import { TMetisSession } from '../../../../../shared/sessions'

/**
 * This will render the forms for creating a new user.
 */
export default function CreateUserEntry(props: {
  user: ClientUser
  userEmptyStringArray: string[]
  usernameAlreadyExists: boolean
  session: NonNullable<TMetisSession<ClientUser>>
  setUserEmptyStringArray: (userEmptyString: string[]) => void
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT PROPERTIES -- */

  let user: ClientUser = props.user
  let userEmptyStringArray: string[] = props.userEmptyStringArray
  let usernameAlreadyExists: boolean = props.usernameAlreadyExists
  let session: TMetisSession<ClientUser> = props.session
  let duplicateUsernameErrorMessage: string = 'Username already exists.'
  let setUserEmptyStringArray = props.setUserEmptyStringArray
  let handleChange = props.handleChange

  /* -- COMPONENT STATE -- */

  const [deliverUsernameError, setDeliverUsernameError] =
    useState<boolean>(false)
  const [deliverFirstNameError, setDeliverFirstNameError] =
    useState<boolean>(false)
  const [deliverLastNameError, setDeliverLastNameError] =
    useState<boolean>(false)
  const [deliverPassword1Error, setDeliverPassword1Error] =
    useState<boolean>(false)
  const [deliverPassword2Error, setDeliverPassword2Error] =
    useState<boolean>(false)
  const [usernameErrorMessage, setUsernameErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [firstNameErrorMessage, setFirstNameErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [password1ErrorMessage, setPassword1ErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [usernameClassName, setUsernameClassName] = useState<string>('')
  const [createFirstNameClassName, setCreateFirstNameClassName] =
    useState<string>('')
  const [createLastNameClassName, setCreateLastNameClassName] =
    useState<string>('')
  const [password1ClassName, setPassword1ClassName] = useState<string>('')
  const [password2ClassName, setPassword2ClassName] = useState<string>('')
  const [roleClassName, setRoleClassName] = useState<string>('')
  const [selectedRoleClassName, setSelectedRoleClassName] =
    useState<string>('DefaultValue')

  /* -- COMPONENT EFFECTS -- */

  useEffect(() => {
    // If the user has entered a username, check to see if it already exists.
    if (usernameAlreadyExists) {
      setUsernameErrorMessage(duplicateUsernameErrorMessage)
      setDeliverUsernameError(true)
    }
  }, [usernameAlreadyExists])

  /* -- COMPONENT FUNCTIONS -- */

  const removeUserEmptyString = (field: string) => {
    userEmptyStringArray.map((userEmptyString: string, index: number) => {
      if (userEmptyString === `field=${field}`) {
        userEmptyStringArray.splice(index, 1)
      }
    })
  }

  /* -- PRE-RENDER PROCESSING -- */

  // Grab the current user from the session.
  let { user: currentUser } = session

  let passwordLabel: string = 'Password'
  let confirmPasswordLabel: string = 'Confirm Password'

  // Default list of roles to select from.
  let listOfRoles: UserRole[] = [UserRole.AVAILABLE_ROLES.student]

  // If the current user in session has
  // proper authorization and their role
  // is an admin, then they are allowed
  // to create users with any role.
  if (
    currentUser.isAuthorized(['READ', 'WRITE', 'DELETE']) &&
    currentUser.role.id === 'admin'
  ) {
    listOfRoles = [
      UserRole.AVAILABLE_ROLES.student,
      UserRole.AVAILABLE_ROLES.instructor,
      UserRole.AVAILABLE_ROLES.admin,
      UserRole.AVAILABLE_ROLES.revokedAccess,
    ]
  }

  if (user.needsPasswordReset) {
    passwordLabel = 'Temporary Password'
    confirmPasswordLabel = 'Confirm Temporary Password'
  }

  /* -- RENDER -- */

  return (
    <form
      className='CreateUserEntry'
      onSubmit={(event) => event.preventDefault()}
      autoComplete='off'
    >
      <Detail
        label='Username'
        initialValue={user.userID}
        deliverValue={(userID: string) => {
          user.userID = userID

          if (userID !== '' && user.hasValidUsername) {
            removeUserEmptyString('userID')
            setDeliverUsernameError(false)
            setUsernameClassName('Correct')
            handleChange()
          }

          if (userID === '' && !user.hasValidUsername) {
            setDeliverUsernameError(true)
            setUserEmptyStringArray([...userEmptyStringArray, `field=userID`])
            setUsernameErrorMessage('At least one character is required here.')
          }

          if (userID !== '' && !user.hasValidUsername) {
            setDeliverUsernameError(true)
            setUsernameErrorMessage(
              'Usernames must be between 5 and 25 characters long and can only contain letters, numbers, and the following special characters: - _ .',
            )
          }
        }}
        options={{
          deliverError: deliverUsernameError,
          deliverErrorMessage: usernameErrorMessage,
          uniqueLabelClassName: usernameClassName,
          uniqueInputClassName: usernameClassName,
          placeholder: 'Enter a username here...',
        }}
      />
      <DetailDropDown<UserRole>
        label='Role'
        options={listOfRoles}
        currentValue={user.role}
        isExpanded={false}
        uniqueDropDownStyling={{}}
        uniqueOptionStyling={(role: UserRole) => {
          return {}
        }}
        renderOptionClassName={(role: UserRole) => {
          return ''
        }}
        renderDisplayName={(role: UserRole) => role.name}
        deliverValue={(role: UserRole) => {
          user.role = role
          setRoleClassName('Correct')
          setSelectedRoleClassName('Correct')
          handleChange()
        }}
        optional={{
          uniqueLabelClassName: roleClassName,
          uniqueFieldClassName: roleClassName,
          uniqueCurrentValueClassName: selectedRoleClassName,
        }}
      />
      <Detail
        label='First Name'
        initialValue={user.firstName}
        deliverValue={(firstName: string) => {
          user.firstName = firstName

          if (firstName !== '' && user.hasValidFirstName) {
            removeUserEmptyString('firstName')
            setDeliverFirstNameError(false)
            setCreateFirstNameClassName('Correct')
            handleChange()
          }

          if (firstName === '') {
            setDeliverFirstNameError(true)
            setFirstNameErrorMessage('At least one character is required here.')
            setUserEmptyStringArray([
              ...userEmptyStringArray,
              `field=firstName`,
            ])
          }

          if (!user.hasValidFirstName && firstName !== '') {
            setDeliverFirstNameError(true)
            setFirstNameErrorMessage(
              'First names must be between 1 and 50 characters long and can only contain letters.',
            )
            setUserEmptyStringArray([
              ...userEmptyStringArray,
              `field=firstName`,
            ])
          }
        }}
        options={{
          deliverError: deliverFirstNameError,
          deliverErrorMessage: firstNameErrorMessage,
          uniqueLabelClassName: createFirstNameClassName,
          uniqueInputClassName: createFirstNameClassName,
          placeholder: 'Enter a first name here...',
        }}
      />
      <Detail
        label='Last Name'
        initialValue={user.lastName}
        deliverValue={(lastName: string) => {
          user.lastName = lastName

          if (lastName !== '' && user.hasValidLastName) {
            removeUserEmptyString('lastName')
            setDeliverLastNameError(false)
            setCreateLastNameClassName('Correct')
            handleChange()
          }

          if (lastName === '') {
            setDeliverLastNameError(true)
            setLastNameErrorMessage('At least one character is required here.')
            setUserEmptyStringArray([...userEmptyStringArray, `field=lastName`])
          }

          if (!user.hasValidLastName && lastName !== '') {
            setDeliverLastNameError(true)
            setLastNameErrorMessage(
              'Last names must be between 1 and 50 characters long and can only contain letters.',
            )
            setUserEmptyStringArray([...userEmptyStringArray, `field=lastName`])
          }
        }}
        options={{
          deliverError: deliverLastNameError,
          deliverErrorMessage: lastNameErrorMessage,
          uniqueLabelClassName: createLastNameClassName,
          uniqueInputClassName: createLastNameClassName,
          placeholder: 'Enter a last name here...',
        }}
      />
      <Detail
        label={passwordLabel}
        initialValue={null}
        deliverValue={(password: string) => {
          user.password1 = password

          if (user.hasValidPassword1 && password !== '') {
            removeUserEmptyString('password1')
            setDeliverPassword1Error(false)
            setPassword1ClassName('Correct')
            handleChange()
          }

          if (password === '') {
            setDeliverPassword1Error(true)
            setPassword1ErrorMessage('At least one character is required here.')
            setUserEmptyStringArray([
              ...userEmptyStringArray,
              `field=password1`,
            ])
          }

          if (!user.hasValidPassword1 && password !== '') {
            setDeliverPassword1Error(true)
            setPassword1ErrorMessage(
              'Password must be between 8 and 50 characters and cannot contain spaces.',
            )
          }

          // If the user has entered a password in the second password field,
          // check to see if the two passwords match.
          if (!user.passwordsMatch && user.password2) {
            setDeliverPassword2Error(true)
            setPassword2ErrorMessage('Passwords must match.')
          }
          // If the user has entered a password in the second password field
          // and the two passwords match, remove the error.
          else if (user.passwordsMatch && user.password2) {
            setDeliverPassword2Error(false)
            setPassword2ClassName('Correct')
          }
        }}
        options={{
          deliverError: deliverPassword1Error,
          deliverErrorMessage: password1ErrorMessage,
          uniqueLabelClassName: password1ClassName,
          uniqueInputClassName: password1ClassName,
          inputType: 'password',
          placeholder: 'Enter a password here...',
        }}
      />

      <Detail
        label={confirmPasswordLabel}
        initialValue={null}
        deliverValue={(password: string) => {
          user.password2 = password

          if (user.hasValidPassword2 && password !== '') {
            removeUserEmptyString('password2')
            setDeliverPassword2Error(false)
            setPassword2ClassName('Correct')
            handleChange()
          }

          if (!user.hasValidPassword2 && password !== '') {
            setDeliverPassword2Error(true)
            setPassword2ErrorMessage(
              'Password must be between 8 and 50 characters and cannot contain spaces.',
            )
          }

          if (password === '') {
            setDeliverPassword2Error(true)
            setPassword2ErrorMessage('At least one character is required here.')
            setUserEmptyStringArray([
              ...userEmptyStringArray,
              `field=password2`,
            ])
          }

          if (
            user.hasValidPassword2 &&
            password !== '' &&
            !user.passwordsMatch
          ) {
            setDeliverPassword2Error(true)
            setPassword2ErrorMessage('Passwords must match.')
          }
        }}
        options={{
          deliverError: deliverPassword2Error,
          deliverErrorMessage: password2ErrorMessage,
          uniqueLabelClassName: password2ClassName,
          uniqueInputClassName: password2ClassName,
          inputType: 'password',
          placeholder: 'Confirm your password here...',
        }}
      />
      <div className='NeedsPasswordResetContainer'>
        <div className='Title'>Needs Password Reset:</div>
        <Toggle
          initiallyActivated={user.needsPasswordReset}
          deliverValue={() => {
            user.needsPasswordReset = !user.needsPasswordReset
            handleChange()
          }}
        />
      </div>
    </form>
  )
}
