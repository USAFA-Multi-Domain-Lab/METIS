import { useState } from 'react'
import { IPage } from '../App'
import { Detail } from '../content/form/Form'
import Navigation from '../content/general-layout/Navigation'
import './UserResetPage.scss'
import { useGlobalContext } from 'src/context'
import { useMountHandler } from 'src/toolbox/hooks'
import ClientUser from 'src/users'

export interface IUserResetPage extends IPage {}

/**
 * This page allows the user to reset their password.
 */
export default function UserResetPage(): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { forceUpdate, notify, goToPage, logout, finishLoading } =
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
  const [password1ClassName, setPassword1ClassName] = useState<string>('')
  const [password2ClassName, setPassword2ClassName] = useState<string>('')

  /* -- COMPONENT EFFECTS -- */

  // Equivalent to componentDidMount().
  const [mountHandled] = useMountHandler(async (done) => {
    // Finish loading.
    finishLoading()
    done()
  })

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
        await ClientUser.resetPassword(user)
        notify('User successfully saved.')
        goToPage('HomePage', {})
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
      {/* -- NAVIGATION -- */}
      <Navigation
        brandingCallback={null}
        brandingTooltipDescription={null}
        links={[
          {
            text: 'Log out',
            handleClick: () =>
              logout({
                returningPagePath: 'HomePage',
                returningPageProps: {},
              }),
            visible: true,
            key: 'log-out',
          },
        ]}
      />

      {/* -- CONTENT -- */}
      <div className='Content'>
        <div className='ResetUserEntry'>
          <div className='UserIDContainer'>
            <div className='Title'>User ID:</div>
            <div className='UserID'>{user.userID}</div>
          </div>
          <Detail
            label='New Password'
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
                setPassword2ClassName('Correct')
              }
            }}
            options={{
              deliverError: deliverPassword1Error,
              deliverErrorMessage: password1ErrorMessage,
              uniqueLabelClassName: password1ClassName,
              uniqueInputClassName: password1ClassName,
              inputType: 'password',
              placeholder: 'Enter a new password here...',
            }}
          />

          <Detail
            label='Confirm New Password'
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
            options={{
              deliverError: deliverPassword2Error,
              deliverErrorMessage: password2ErrorMessage,
              uniqueLabelClassName: password2ClassName,
              uniqueInputClassName: password2ClassName,
              inputType: 'password',
              placeholder: 'Confirm your new password here...',
            }}
          />
        </div>

        <div className='ButtonContainer'>
          <div className={saveButtonClassName} onClick={() => save()}>
            Save
          </div>
        </div>
      </div>

      {/* -- FOOTER -- */}
      <div className='FooterContainer'>
        <a
          href='https://www.midjourney.com/'
          className='Credit'
          draggable={false}
        >
          Photo by Midjourney
        </a>
      </div>
    </div>
  )
}
