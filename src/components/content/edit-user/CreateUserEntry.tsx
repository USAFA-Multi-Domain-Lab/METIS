import { useState } from 'react'
import { useStore } from 'react-context-hook'
import { fullAccessRoles, User, userRoles } from '../../../modules/users'
import { Detail, DetailDropDown } from '../form/Form'
import Toggle from '../user-controls/Toggle'
import './CreateUserEntry.scss'

/**
 * This will render the forms for creating a new user.
 * @param props
 * @param props.user The user object to be rendered.
 * @param props.userEmptyStringArray An array that will contain the fields that are empty.
 * @param props.setUserEmptyStringArray A function that will add the empty fields to the array.
 * @param props.handleChange Tracks if there have been changes made that need to be saved.
 * @returns JSX.Element | null
 */
export default function CreateUserEntry(props: {
  user: User
  userEmptyStringArray: Array<string>
  setUserEmptyStringArray: (userEmptyString: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let user: User = props.user
  let userEmptyStringArray: Array<string> = props.userEmptyStringArray
  let setUserEmptyStringArray = props.setUserEmptyStringArray
  let handleChange = props.handleChange

  /* -- GLOBAL STATE -- */
  const [currentUser] = useStore<User>('currentUser')
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

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
  const [generalErrorMessage, setGeneralErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [usernameErrorMessage, setUsernameErrorMessage] = useState<string>(
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

  /* -- COMPONENT FUNCTIONS -- */

  const forceUpdate = () => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  const removeUserEmptyString = (field: string) => {
    userEmptyStringArray.map((userEmptyString: string, index: number) => {
      if (userEmptyString === `field=${field}`) {
        userEmptyStringArray.splice(index, 1)
      }
    })
  }

  /* -- RENDER -- */

  let passwordLabel: string = 'Password'
  let confirmPasswordLabel: string = 'Confirm Password'
  let listOfRoles: string[] = [userRoles.Student]

  if (
    currentUser &&
    currentUser.role &&
    fullAccessRoles.includes(currentUser.role)
  ) {
    listOfRoles.push(userRoles.Instructor)
  }

  if (user.needsPasswordReset) {
    passwordLabel = 'Temporary Password'
    confirmPasswordLabel = 'Confirm Temporary Password'
  }

  return (
    <div className='CreateUserEntry'>
      <Detail
        label='Username'
        initialValue={user.userID}
        deliverValue={(userID: string) => {
          let userIDRegex: RegExp = new RegExp(/^([a-zA-Z0-9-_.]{5,25})$/)
          let userIDIsValid: boolean = userIDRegex.test(userID)

          if (userID !== '' && userIDIsValid) {
            user.userID = userID
            removeUserEmptyString('userID')
            setDeliverUsernameError(false)
            setUsernameClassName('Correct')
            if (user.canSave) {
              handleChange()
            } else {
              forceUpdate()
            }
          }

          if (userID === '' && !userIDIsValid) {
            setDeliverUsernameError(true)
            setUserEmptyStringArray([...userEmptyStringArray, `field=userID`])
            setUsernameErrorMessage('At least one character is required here.')
          }

          if (userID !== '' && !userIDIsValid) {
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
      <DetailDropDown<string>
        label='Role'
        options={listOfRoles}
        currentValue={user.role}
        isExpanded={false}
        uniqueDropDownStyling={{}}
        uniqueOptionStyling={(role: string) => {
          return {}
        }}
        renderOptionClassName={(role: string) => {
          return ''
        }}
        renderDisplayName={(role: string) => role}
        deliverValue={(role: string) => {
          user.role = role
          setRoleClassName('Correct')
          setSelectedRoleClassName('Correct')
          if (user.canSave) {
            handleChange()
          } else {
            forceUpdate()
          }
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
          if (firstName !== '') {
            user.firstName = firstName
            removeUserEmptyString('firstName')
            setDeliverFirstNameError(false)
            setCreateFirstNameClassName('Correct')
            if (user.canSave) {
              handleChange()
            } else {
              forceUpdate()
            }
          } else {
            setDeliverFirstNameError(true)
            setUserEmptyStringArray([
              ...userEmptyStringArray,
              `field=firstName`,
            ])
          }
        }}
        options={{
          deliverError: deliverFirstNameError,
          deliverErrorMessage: generalErrorMessage,
          uniqueLabelClassName: createFirstNameClassName,
          uniqueInputClassName: createFirstNameClassName,
          placeholder: 'Enter a first name here...',
        }}
      />
      <Detail
        label='Last Name'
        initialValue={user.lastName}
        deliverValue={(lastName: string) => {
          if (lastName !== '') {
            user.lastName = lastName
            removeUserEmptyString('lastName')
            setDeliverLastNameError(false)
            setCreateLastNameClassName('Correct')
            if (user.canSave) {
              handleChange()
            } else {
              forceUpdate()
            }
          } else {
            setDeliverLastNameError(true)
            setUserEmptyStringArray([...userEmptyStringArray, `field=lastName`])
          }
        }}
        options={{
          deliverError: deliverLastNameError,
          deliverErrorMessage: generalErrorMessage,
          uniqueLabelClassName: createLastNameClassName,
          uniqueInputClassName: createLastNameClassName,
          placeholder: 'Enter a last name here...',
        }}
      />
      <Detail
        label={passwordLabel}
        initialValue={null}
        deliverValue={(password: string) => {
          let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)
          let passwordIsValid: boolean = passwordRegex.test(password)
          user.password1 = password

          if (passwordIsValid && password !== '') {
            removeUserEmptyString('password1')
            setDeliverPassword1Error(false)
            setPassword1ClassName('Correct')
            if (user.canSave) {
              handleChange()
            } else {
              forceUpdate()
            }
          }

          if (password === '') {
            setDeliverPassword1Error(true)
            setPassword1ErrorMessage('At least one character is required here.')
            setUserEmptyStringArray([
              ...userEmptyStringArray,
              `field=password1`,
            ])
          }

          if (!passwordIsValid && password !== '') {
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
          let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)
          let passwordIsValid: boolean = passwordRegex.test(password)
          user.password2 = password

          if (passwordIsValid && password !== '') {
            removeUserEmptyString('password2')
            setDeliverPassword2Error(false)
            setPassword2ClassName('Correct')
            if (user.canSave) {
              handleChange()
            } else {
              forceUpdate()
            }
          }

          if (!passwordIsValid && password !== '') {
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

          if (passwordIsValid && password !== '' && !user.passwordsMatch) {
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
    </div>
  )
}
