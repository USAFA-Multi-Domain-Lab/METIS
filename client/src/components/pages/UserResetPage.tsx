import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultLayout, TPage_P } from '.'
import { Detail } from '../content/form/Form'
import { LogoutLink } from '../content/general-layout/Navigation'
import './UserResetPage.scss'

export interface IUserResetPage extends TPage_P {}

/**
 * This page allows the user to reset their password.
 */
export default function UserResetPage(): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { forceUpdate, notify, navigateTo, logout, finishLoading } =
    globalContext.actions
  const [session] = globalContext.session

  /* -- COMPONENT STATE -- */

  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [userEmptyStringArray, setUserEmptyStringArray] = useState<
    Array<string>
  >([])
  const [deliverPassword1Error, setDeliverPassword1Error] =
    useState<boolean>(false)
  const [deliverPassword2Error, setDeliverPassword2Error] =
    useState<boolean>(false)
  const [password1ErrorMessage, setPassword1ErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [password1, setPassword1] = useState<string | null>(null)
  const [password2, setPassword2] = useState<string | null>(null)

  /* -- COMPONENT EFFECTS -- */

  // Equivalent to componentDidMount().
  const [mountHandled] = useMountHandler(async (done) => {
    // Finish loading.
    finishLoading()
    setPassword1(user.password1 || null)
    setPassword2(user.password2 || null)
    done()
  })

  /* -- COMPUTED -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(() => ({
    links: [LogoutLink(globalContext)],
    logoLinksHome: false,
  }))

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Require session.
  if (session === null) {
    return null
  }

  // Extract properties from session.
  const { user } = session

  /* -- COMPONENT FUNCTIONS -- */

  // This is called to save any changes
  // made.
  const save = async (): Promise<void> => {
    if (areUnsavedChanges) {
      setAreUnsavedChanges(false)

      try {
        await ClientUser.$resetPassword(user)
        notify('User successfully saved.')
        navigateTo('HomePage', {})
      } catch (error: any) {
        notify('User failed to save.')
        setAreUnsavedChanges(true)
      }
    }
  }

  // This is called when a change is
  // made that would require saving.
  const handleChange = (): void => {
    setAreUnsavedChanges(true)
    forceUpdate()
  }

  const removeUserEmptyString = (field: string) => {
    userEmptyStringArray.map((userEmptyString: string, index: number) => {
      if (userEmptyString === `field=${field}`) {
        userEmptyStringArray.splice(index, 1)
      }
    })
  }

  /* -- RENDER -- */

  let isEmptyString: boolean = userEmptyStringArray.length > 0

  // This will gray out the save button
  // if there are no unsaved changes or
  // if there are empty strings or if
  // the user does not have permission
  // to save.
  let grayOutSaveButton: boolean =
    !areUnsavedChanges || isEmptyString || !user.canSave

  let saveButtonClassName: string = 'Button'

  if (grayOutSaveButton) {
    saveButtonClassName += ' Disabled'
  }

  return (
    <div className='UserResetPage Page'>
      <DefaultLayout navigation={navigation}>
        <div className='ResetUserEntry'>
          <div className='UserIDContainer'>
            <div className='Title'>User ID:</div>
            <div className='UserID'>{user.userID}</div>
          </div>
          <Detail
            label='New Password'
            currentValue={password1}
            deliverValue={(password: string) => {
              user.password1 = password
              setPassword1(password)

              if (user.hasValidPassword1 && password !== '') {
                removeUserEmptyString('password1')
                setDeliverPassword1Error(false)
                handleChange()
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
              }
            }}
            emptyStringAllowed={false}
            deliverError={deliverPassword1Error}
            errorMessage={password1ErrorMessage}
            inputType='password'
            placeholder='Enter a new password here...'
          />

          <Detail
            label='Confirm New Password'
            currentValue={password2}
            deliverValue={(password: string) => {
              user.password2 = password
              setPassword2(password)

              if (user.hasValidPassword2 && password !== '') {
                removeUserEmptyString('password2')
                setDeliverPassword2Error(false)
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
                setPassword2ErrorMessage(
                  'At least one character is required here.',
                )
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
            emptyStringAllowed={false}
            deliverError={deliverPassword2Error}
            errorMessage={password2ErrorMessage}
            inputType='password'
            placeholder='Confirm your new password here...'
          />
        </div>

        <div className='ButtonContainer'>
          <div className={saveButtonClassName} onClick={() => save()}>
            Save
          </div>
        </div>
      </DefaultLayout>
    </div>
  )
}
