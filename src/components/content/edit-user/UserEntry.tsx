import { useState } from 'react'
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
  const [password1ErrorMessage, setPassword1ErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState<string>(
    'At least one character is required here.',
  )

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

  if (fullAccessRoles.includes(currentUser.role)) {
    listOfRoles.push(userRoles.Instructor)
  }

  if (isDefaultUser && user.passwordIsRequired) {
    return (
      <div className='UserEntry'>
        <Detail
          label='Username'
          initialValue={user.userID}
          deliverValue={(userID: string) => {
            if (userID !== '') {
              user.userID = userID
              removeUserEmptyString('userID')
              setDeliverUsernameError(false)
              if (user.canSave) {
                handleChange()
              } else {
                forceUpdate()
              }
            } else {
              setDeliverUsernameError(true)
              setUserEmptyStringArray([...userEmptyStringArray, `field=userID`])
            }
          }}
          deliverError={deliverUsernameError}
          deliverErrorMessage={generalErrorMessage}
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
        />
        <Detail
          label='Last Name'
          initialValue={user.lastName}
          deliverValue={(lastName: string) => {
            if (lastName !== '') {
              user.lastName = lastName
              removeUserEmptyString('lastName')
              setDeliverLastNameError(false)
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
              if (user.canSave) {
                handleChange()
              } else {
                forceUpdate()
              }
            } else if (password === '') {
              setDeliverPassword1Error(true)
              setUserEmptyStringArray([
                ...userEmptyStringArray,
                `field=password1`,
              ])
            } else {
              setDeliverPassword1Error(true)
              setPassword1ErrorMessage(
                'Password must be between 8 and 50 characters and cannot contain spaces.',
              )
            }
          }}
          deliverError={deliverPassword1Error}
          deliverErrorMessage={password1ErrorMessage}
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
              if (user.canSave) {
                handleChange()
              } else {
                forceUpdate()
              }
            } else if (password === '') {
              setDeliverPassword2Error(true)
              setUserEmptyStringArray([
                ...userEmptyStringArray,
                `field=password2`,
              ])
            } else {
              setDeliverPassword2Error(true)
              setPassword2ErrorMessage(
                'Password must be between 8 and 50 characters and cannot contain spaces.',
              )
            }
          }}
          deliverError={deliverPassword2Error}
          deliverErrorMessage={password2ErrorMessage}
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
            if (firstName !== user.firstName && firstName !== '') {
              user.firstName = firstName
              removeUserEmptyString('firstName')
              setDeliverFirstNameError(false)
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
        />
        <Detail
          label='Last Name'
          initialValue={user.lastName}
          deliverValue={(lastName: string) => {
            if (lastName !== user.lastName && lastName !== '') {
              user.lastName = lastName
              removeUserEmptyString('lastName')
              setDeliverLastNameError(false)
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
        />
      </div>
    )
  }
}
