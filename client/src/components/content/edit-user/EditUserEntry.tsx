import { useState } from 'react'
import User from 'metis/users'
import { Detail } from '../form/Form'
import './EditUserEntry.scss'

/**
 * This will render the forms for editing a new user.
 * @param props
 * @param props.user The user object to be rendered.
 * @param props.userEmptyStringArray An array that will contain the fields that are empty.
 * @param props.setUserEmptyStringArray A function that will add the empty fields to the array.
 * @param props.handleChange Tracks if there have been changes made that need to be saved.
 * @returns JSX.Element | null
 */
export default function EditUserEntry(props: {
  user: User
  userEmptyStringArray: Array<string>
  setUserEmptyStringArray: (userEmptyString: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let user: User = props.user
  let userEmptyStringArray: Array<string> = props.userEmptyStringArray
  let setUserEmptyStringArray = props.setUserEmptyStringArray
  let handleChange = props.handleChange

  /* -- COMPONENT STATE -- */
  const [deliverFirstNameError, setDeliverFirstNameError] =
    useState<boolean>(false)
  const [deliverLastNameError, setDeliverLastNameError] =
    useState<boolean>(false)
  const [generalErrorMessage, setGeneralErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [updateFirstNameClassName, setUpdateFirstNameClassName] =
    useState<string>('')
  const [updateLastNameClassName, setUpdateLastNameClassName] =
    useState<string>('')

  /* -- COMPONENT FUNCTIONS -- */

  const removeUserEmptyString = (field: string) => {
    userEmptyStringArray.map((userEmptyString: string, index: number) => {
      if (userEmptyString === `field=${field}`) {
        userEmptyStringArray.splice(index, 1)
      }
    })
  }

  return (
    <div className='EditUserEntry'>
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
        options={{
          deliverError: deliverFirstNameError,
          deliverErrorMessage: generalErrorMessage,
          uniqueLabelClassName: updateFirstNameClassName,
          uniqueInputClassName: updateFirstNameClassName,
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
            setUpdateLastNameClassName('Correct')
            handleChange()
          } else {
            setDeliverLastNameError(true)
            setUserEmptyStringArray([...userEmptyStringArray, `field=lastName`])
          }
        }}
        options={{
          deliverError: deliverLastNameError,
          deliverErrorMessage: generalErrorMessage,
          uniqueLabelClassName: updateLastNameClassName,
          uniqueInputClassName: updateLastNameClassName,
          placeholder: 'Enter a last name here...',
        }}
      />
    </div>
  )
}
