import React, { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientUser from 'src/users'
import { TPage_P } from '.'
import { Detail } from '../content/form/Form'
import Branding from '../content/general-layout/Branding'
import './AuthPage.scss'

export interface IAuthPage extends TPage_P {}

// This will render a page where a user can
// login.
export default function AuthPage(props: IAuthPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { beginLoading, finishLoading, navigateTo, connectToServer } =
    globalContext.actions
  const [_, setSession] = globalContext.session

  /* -- COMPONENT STATE -- */

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [userID, setUserID] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)

  /* -- COMPONENT FUNCTIONS -- */

  // This will force a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // Called to check if the form can be
  // submit.
  const canSubmit = (): boolean => {
    if (userID && password) {
      return userID.length > 0 && password.length > 0
    }
    return false
  }

  // This is called when a change is made in the form.
  const handleChange = (): void => {
    setErrorMessage(null)
    forceUpdate()
  }

  // This is called when the form is submitted.
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()

    if (userID && password) {
      if (userID.length > 0 && password.length > 0) {
        setIsSubmitting(true)
        beginLoading('Logging in...')
        setErrorMessage(null)

        // Called when an error happens from
        // login that needs to be displayed
        // to the user.
        const handleLoginError = (errorMessage: string): void => {
          setIsSubmitting(false)
          setErrorMessage(errorMessage)
          finishLoading()
        }

        // Login.
        try {
          let { correct, session } = await ClientUser.$login(userID, password)

          // If correct and a session was returned,
          // then login was successful.
          if (correct && session !== null) {
            setIsSubmitting(false)
            setSession(session)
            connectToServer()

            // If the user needs a password reset,
            // then navigate to the user reset page.
            if (session.user.needsPasswordReset) {
              navigateTo('UserResetPage', {})
            }
            // Else, go to the home page.
            else {
              navigateTo('HomePage', {})
            }
          } else {
            handleLoginError('Incorrect username or password.')
          }
        } catch (error: any) {
          // Handles duplicate logins.
          if (error.response?.status === 409) {
            handleLoginError(
              'Account is already logged in on another device or browser.',
            )
          } else {
            handleLoginError(
              'Something went wrong on our end. Please try again later.',
            )
          }
        }
      } else {
        setErrorMessage('Please fill all fields.')
      }
    } else {
      setErrorMessage('Client error: Input elements not found in DOM.')
    }
  }

  /* -- RENDER -- */

  let submitIsDisabled: boolean = !canSubmit() || isSubmitting

  return (
    <div className='AuthPage Page'>
      <div className='Login'>
        <div className='ErrorMessage'>{errorMessage}</div>
        <Branding linksHome={false} />
        <form className='Form' onChange={handleChange} onSubmit={handleSubmit}>
          <Detail
            label={'Username'}
            initialValue={null}
            deliverValue={(username: string) => {
              setUserID(username)
            }}
            options={{
              uniqueLabelClassName: 'Hidden',
              placeholder: 'Username',
              emptyStringAllowed: true,
            }}
          />
          <Detail
            label={'Password'}
            initialValue={null}
            deliverValue={(password: string) => {
              setPassword(password)
            }}
            options={{
              uniqueLabelClassName: 'Hidden',
              inputType: 'password',
              placeholder: 'Password',
              emptyStringAllowed: true,
            }}
          />
          <input
            className='Submit Button'
            type='submit'
            value='Login'
            disabled={submitIsDisabled}
          />
        </form>
      </div>
    </div>
  )
}
