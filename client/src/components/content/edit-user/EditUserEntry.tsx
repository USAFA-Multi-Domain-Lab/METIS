import { useState } from 'react'
import ClientUser from 'src/users'
import { Detail } from '../form/Form'
import './EditUserEntry.scss'

/**
 * This will render the forms for editing a new user.
 */
export default function EditUserEntry(props: {
  user: ClientUser
  userEmptyStringArray: string[]
  setUserEmptyStringArray: (userEmptyString: string[]) => void
  handleChange: () => void
}): JSX.Element | null {
  let user: ClientUser = props.user
  let userEmptyStringArray: string[] = props.userEmptyStringArray
  let setUserEmptyStringArray = props.setUserEmptyStringArray
  let handleChange = props.handleChange

  /* -- COMPONENT STATE -- */
  const [deliverFirstNameError, setDeliverFirstNameError] =
    useState<boolean>(false)
  const [deliverLastNameError, setDeliverLastNameError] =
    useState<boolean>(false)
  const [firstNameErrorMessage, setFirstNameErrorMessage] = useState<string>('')
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState<string>('')
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
    <form
      className='EditUserEntry'
      onSubmit={(event) => event.preventDefault()}
      autoComplete='off'
    >
      <div className='UserIDContainer'>
        <div className='Title'>User ID:</div>
        <div className='UserID'>{user.userID}</div>
      </div>
      <div className='RoleContainer'>
        <div className='Title'>Role:</div>
        <div className='Role'>{user.role.name}</div>
      </div>
      <Detail
        label='First Name'
        currentValue={user.firstName}
        deliverValue={(firstName: string) => {
          user.firstName = firstName

          if (firstName !== '' && user.hasValidFirstName) {
            removeUserEmptyString('firstName')
            setDeliverFirstNameError(false)
            setUpdateFirstNameClassName('Correct')
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
        emptyStringAllowed={false}
        deliverError={deliverFirstNameError}
        errorMessage={firstNameErrorMessage}
        uniqueLabelClassName={updateFirstNameClassName}
        uniqueInputClassName={updateFirstNameClassName}
        placeholder='Enter a first name here...'
      />
      <Detail
        label='Last Name'
        currentValue={user.lastName}
        deliverValue={(lastName: string) => {
          user.lastName = lastName

          if (lastName !== '' && user.hasValidLastName) {
            removeUserEmptyString('lastName')
            setDeliverLastNameError(false)
            setUpdateLastNameClassName('Correct')
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
        emptyStringAllowed={false}
        deliverError={deliverLastNameError}
        errorMessage={lastNameErrorMessage}
        uniqueLabelClassName={updateLastNameClassName}
        uniqueInputClassName={updateLastNameClassName}
        placeholder='Enter a last name here...'
      />
    </form>
  )
}
