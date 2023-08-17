import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { fullAccessRoles, User, userRoles } from '../../../modules/users'
import { Detail, DetailDropDown } from '../form/Form'
import './UserEntry.scss'

// This will render the basic editable
// details of the user itself.
export default function UserEntry(props: {
  user: User
  isDefaultUser: boolean
  userEmptyStringArray: Array<string>
  setUserEmptyStringArray: (userEmptyString: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let user: User = props.user
  let isDefaultUser: boolean = props.isDefaultUser
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
  const [updateFirstNameClassName, setUpdateFirstNameClassName] =
    useState<string>('')
  const [updateLastNameClassName, setUpdateLastNameClassName] =
    useState<string>('')

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

  let listOfRoles: string[] = [userRoles.Student]

  if (currentUser && fullAccessRoles.includes(currentUser.role)) {
    listOfRoles.push(userRoles.Instructor)
  }

  if (isDefaultUser && user.passwordIsRequired) {
    return (
      <div className='UserEntry'>
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
              setUsernameErrorMessage(
                'At least one character is required here.',
              )
            }

            if (userID !== '' && !userIDIsValid) {
              setDeliverUsernameError(true)
              setUsernameErrorMessage(
                'Usernames must be between 5 and 25 characters long and can only contain letters, numbers, and the following special characters: - _ .',
              )
            }
          }}
          deliverError={deliverUsernameError}
          deliverErrorMessage={usernameErrorMessage}
          uniqueLabelClassName={usernameClassName}
          uniqueInputClassName={usernameClassName}
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
            if (user.canSave) {
              handleChange()
            } else {
              forceUpdate()
            }
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
          deliverError={deliverFirstNameError}
          deliverErrorMessage={generalErrorMessage}
          uniqueLabelClassName={createFirstNameClassName}
          uniqueInputClassName={createFirstNameClassName}
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
              setUserEmptyStringArray([
                ...userEmptyStringArray,
                `field=lastName`,
              ])
            }
          }}
          deliverError={deliverLastNameError}
          deliverErrorMessage={generalErrorMessage}
          uniqueLabelClassName={createLastNameClassName}
          uniqueInputClassName={createLastNameClassName}
        />
        <Detail
          label='Password'
          initialValue={'Enter your password'}
          deliverValue={(password: string) => {
            let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)
            let passwordIsValid: boolean = passwordRegex.test(password)

            if (passwordIsValid && password !== '') {
              user.password1 = password
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
              setPassword1ErrorMessage(
                'At least one character is required here.',
              )
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
          }}
          deliverError={deliverPassword1Error}
          deliverErrorMessage={password1ErrorMessage}
          uniqueLabelClassName={password1ClassName}
          uniqueInputClassName={password1ClassName}
        />

        <Detail
          label='Confirm Password'
          initialValue={'Confirm your password'}
          deliverValue={(password: string) => {
            let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)
            let passwordIsValid: boolean = passwordRegex.test(password)

            if (passwordIsValid && password !== '') {
              user.password2 = password
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
              setPassword2ErrorMessage(
                'At least one character is required here.',
              )
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
          deliverError={deliverPassword2Error}
          deliverErrorMessage={password2ErrorMessage}
          uniqueLabelClassName={password2ClassName}
          uniqueInputClassName={password2ClassName}
        />
      </div>
    )
  } else {
    return (
      <div className='UserEntry'>
        <div className='UserIDContainer'>
          <div className='Title'>User ID:</div>
          <div className='UserID'>{user.userID}</div>
        </div>
        <div className='RoleContainer'>
          <div className='Title'>Role:</div>
          <div className='Role'>{user.role}</div>
        </div>
        <Detail
          label='First Name'
          initialValue={user.firstName}
          deliverValue={(firstName: string) => {
            if (firstName !== '') {
              user.firstName = firstName
              removeUserEmptyString('firstName')
              setDeliverFirstNameError(false)
              setUpdateFirstNameClassName('Correct')
              handleChange()
            } else {
              setDeliverFirstNameError(true)
              setUserEmptyStringArray([
                ...userEmptyStringArray,
                `field=firstName`,
              ])
            }
          }}
          deliverError={deliverFirstNameError}
          deliverErrorMessage={generalErrorMessage}
          uniqueLabelClassName={updateFirstNameClassName}
          uniqueInputClassName={updateFirstNameClassName}
        />
        <Detail
          label='Last Name'
          initialValue={user.lastName}
          deliverValue={(lastName: string) => {
            if (lastName !== '') {
              user.lastName = lastName
              removeUserEmptyString('lastName')
              setDeliverLastNameError(false)
              setUpdateLastNameClassName('Correct')
              handleChange()
            } else {
              setDeliverLastNameError(true)
              setUserEmptyStringArray([
                ...userEmptyStringArray,
                `field=lastName`,
              ])
            }
          }}
          deliverError={deliverLastNameError}
          deliverErrorMessage={generalErrorMessage}
          uniqueLabelClassName={updateLastNameClassName}
          uniqueInputClassName={updateLastNameClassName}
        />
      </div>
    )
  }
}
