import React, { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientLogin from 'src/logins'
import { compute } from 'src/toolbox'
import { TPage_P } from '.'
import { DetailString } from '../content/form/DetailString'
import Branding from '../content/general-layout/Branding'
import './AuthPage.scss'

export interface IAuthPage extends TPage_P {}

/**
 * This will render a page where a user can login.
 */
export default function AuthPage(): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { beginLoading, finishLoading, navigateTo, connectToServer, prompt } =
    globalContext.actions
  const [_, setLogin] = globalContext.login

  /* -- STATE -- */

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  /* -- COMPUTED -- */

  /**
   * This will return true if the form can be submitted.
   */
  const canSubmit: boolean = compute(
    () =>
      username.length > 0 &&
      password.length > 0 &&
      username !== '' &&
      password !== '',
  )

  /* -- FUNCTIONS -- */

  /**
   * Attempts to log the user in.
   * @param forceful Whether to force the login to occur, even if another client is logged in.
   * @resolves When the user has logged in, or when the error
   * that prevented the login has been handled.
   * @recursive
   */
  const attemptLogin = async (forceful: boolean = false): Promise<void> => {
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
      let { login } = await ClientLogin.$logIn(username, password, forceful)

      // If correct and the login information
      // was returned, then login was successful.
      if (login) {
        setIsSubmitting(false)
        setLogin(login)
        connectToServer()

        // If the user needs a password reset,
        // then navigate to the user reset page.
        if (login.user.needsPasswordReset) {
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
        let { choice } = await prompt(
          'Account is already logged in on another device or browser. How do you wish to proceed?',
          ['Logout and login here', 'Go back'],
        )

        if (choice === 'Logout and login here') {
          // Attempt the login again, but forecfully.
          await attemptLogin(true)
        } else {
          setIsSubmitting(false)
          finishLoading()
        }
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

  /**
   * This is called when the form is submitted.
   */
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()

    if (canSubmit) {
      setIsSubmitting(true)
      beginLoading('Logging in...')
      setErrorMessage(null)
      attemptLogin()
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
            stateValue={username}
            setState={setUsername}
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
