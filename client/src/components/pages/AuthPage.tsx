import React, { useState } from 'react'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import ClientUser from 'src/users'
import { TPage_P } from '.'
import { DetailString } from '../content/form/Form'
import Branding from '../content/general-layout/Branding'
import './AuthPage.scss'

export interface IAuthPage extends TPage_P {}

/**
 * This will render a page where a user can login.
 */
export default function AuthPage(props: IAuthPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { beginLoading, finishLoading, navigateTo, connectToServer } =
    globalContext.actions
  const [_, setSession] = globalContext.session

  /* -- STATE -- */

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [userId, setUserId] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  /* -- COMPUTED -- */

  /**
   * This will return true if the form can be submitted.
   */
  const canSubmit: boolean = compute(
    () =>
      userId.length > 0 &&
      password.length > 0 &&
      userId !== '' &&
      password !== '',
  )

  /* -- FUNCTIONS -- */

  /**
   * This is called when the form is submitted.
   */
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()

    if (canSubmit) {
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
        let { session } = await ClientUser.$login(userId, password)

        // If correct and a session was returned,
        // then login was successful.
        if (session) {
          setIsSubmitting(false)
          setSession(session)
          connectToServer()

          // If the user needs a password reset,
          // then navigate to the user reset page.
          if (session.user.needsPasswordReset) {
            navigateTo('UserResetPage', {})
          }
          // Otherwise, go to the home page.
          else {
            navigateTo('HomePage', {})
          }
        }
      } catch (error: any) {
        // Handles duplicate logins.
        if (error.response?.status === 409) {
          handleLoginError(
            'Account is already logged in on another device or browser.',
          )
        }
        // Handles incorrect username or password.
        else if (error.response?.status === 401) {
          handleLoginError('Incorrect username or password.')
        }
        // Handles any other error.
        else {
          handleLoginError(
            'Something went wrong on our end. Please try again later.',
          )
        }
      }
    }
  }

  /* -- RENDER -- */

  return (
    <div className='AuthPage Page'>
      <div className='Login'>
        <div className='ErrorMessage'>{errorMessage}</div>
        <Branding linksHome={false} />
        <form
          className='Form'
          onChange={() => setErrorMessage(null)}
          onSubmit={handleSubmit}
        >
          <DetailString
            fieldType='required'
            handleOnBlur='deliverError'
            label={'Username'}
            stateValue={userId}
            setState={setUserId}
            uniqueLabelClassName='Hidden'
            placeholder='Username'
          />
          <DetailString
            fieldType='required'
            handleOnBlur='deliverError'
            label={'Password'}
            stateValue={password}
            setState={setPassword}
            uniqueLabelClassName='Hidden'
            inputType='password'
            placeholder='Password'
          />
          <input
            className='Submit Button'
            type='submit'
            value='Login'
            disabled={!canSubmit || isSubmitting}
          />
        </form>
      </div>
    </div>
  )
}
