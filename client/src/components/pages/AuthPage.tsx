import { useGlobalContext } from 'metis/client/context/global'
import ClientLogin from 'metis/client/logins'
import { compute } from 'metis/client/toolbox'
import React, { useEffect, useRef, useState } from 'react'
import { TPage_P } from '.'
import { DetailString } from '../content/form/DetailString'
import Branding from '../content/general-layout/Branding'
import {
  ButtonText,
  TButtonTextDisabled,
} from '../content/user-controls/buttons/ButtonText'
import DevOnly from '../content/util/DevOnly'
import './AuthPage.scss'

export interface IAuthPage extends TPage_P {}

/**
 * This will render a page where a user can login.
 */
export default function AuthPage(): TReactElement | null {
  const globalContext = useGlobalContext()
  const { beginLoading, finishLoading, navigateTo, connectToServer, prompt } =
    globalContext.actions
  const [_, setLogin] = globalContext.login

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [submitManually, setSubmitManually] = useState<boolean>(false)
  const form = useRef<HTMLFormElement>(null)

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

  /**
   * The disabled state of the submit button.
   */
  const submitDisabled: TButtonTextDisabled = compute(() => {
    return !canSubmit || isSubmitting ? 'full' : 'none'
  })

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
      // Handles account lockout.
      else if (error.response?.status === 403) {
        handleLoginError(
          'The account has timed out likely due to too many requests being made. Please try again later.',
        )
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

  /**
   * This is called when the dev admin button is clicked.
   */
  const onDevAdminClick = () => {
    let form_elm = form.current

    // Fill out username and password,
    // then trigger a manual submission.
    if (form_elm) {
      // Note: This will only work if the username
      // and password of the default admin user is
      // not changed to no longer be their default
      // values.
      setUsername('admin')
      setPassword('temppass')
      setSubmitManually(true)
    }
  }

  /* -- EFFECTS -- */

  // This will trigger a manual submission whenever
  // `submitManually` is set to true.
  useEffect(() => {
    if (submitManually) form.current?.requestSubmit()
  }, [submitManually])

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
          ref={form}
        >
          <DetailString
            fieldType='required'
            handleOnBlur='deliverError'
            label={'Username'}
            value={username}
            setValue={setUsername}
            uniqueLabelClassName='Hidden'
            placeholder='Username'
          />
          <DetailString
            fieldType='required'
            handleOnBlur='deliverError'
            label={'Password'}
            value={password}
            setValue={setPassword}
            uniqueLabelClassName='Hidden'
            inputType='password'
            placeholder='Password'
          />
          <div className='Buttons'>
            <ButtonText
              type='submit'
              text='Log in'
              onClick={() => {}}
              disabled={submitDisabled}
            />
            <DevOnly>
              <ButtonText
                type='button'
                text='Dev Admin'
                onClick={onDevAdminClick}
              />
            </DevOnly>
          </div>
        </form>
      </div>
    </div>
  )
}
