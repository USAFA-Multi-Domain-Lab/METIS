import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import { usePostInitEffect } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DetailString, DetailToggle } from '../form/Form'
import './EditUserEntry.scss'

/**
 * This will render the form for editing a new user.
 */
export default function EditUserEntry({
  user,
  userEmptyStringArray,
  setUserEmptyStringArray,
  handleChange,
}: TEditUserEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [handleFirstNameError, setHandleFirstNameError] =
    useState<THandleOnBlur>('deliverError')
  const [handleLastNameError, setHandleLastNameError] =
    useState<THandleOnBlur>('deliverError')
  const [firstNameErrorMessage, setFirstNameErrorMessage] = useState<string>('')
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState<string>('')
  const [firstName, setFirstName] = useState<string>(user.firstName)
  const [lastName, setLastName] = useState<string>(user.lastName)
  const [needsPasswordReset, setNeedsPasswordReset] = useState<boolean>(
    user.needsPasswordReset,
  )

  /* -- EFFECTS -- */

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

  /* -- RENDER -- */

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
      <DetailToggle
        label='Password Reset'
        stateValue={needsPasswordReset}
        setState={setNeedsPasswordReset}
      />
    </form>
  )
}

/* ---------------------------- TYPES FOR EDIT USER ENTRY ---------------------------- */

/**
 * The properties for the EditUserEntry component.
 */
export type TEditUserEntry_P = {
  /**
   * The user to be created.
   */
  user: ClientUser
  /**
   * An array of fields with empty strings.
   */
  userEmptyStringArray: string[]
  /**
   * A function that will update the array of fields with empty strings.
   */
  setUserEmptyStringArray: (userEmptyString: string[]) => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}

/**
 * The type of handleOnBlur.
 */
type THandleOnBlur = 'deliverError' | 'none'
