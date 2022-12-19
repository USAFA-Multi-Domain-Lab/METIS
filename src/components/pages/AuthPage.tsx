import React, { useEffect, useRef, useState } from 'react'
import './AuthPage.scss'
import usersModule, { IUser } from '../../modules/users'
import { AxiosError } from 'axios'
import { IPage } from '../App'
import { AnyObject } from '../../modules/toolbox/objects'
import AppState, { AppActions } from '../AppState'

export interface IAuthPageSpecific {
  returningPagePath: string
  returningPageProps: AnyObject
}

export interface IAuthPage extends IPage, IAuthPageSpecific {}

// This will render a page where a user can
// login to view the radar.
export default function AuthPage(props: IAuthPage): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT REFS -- */

  const userIDField = useRef<HTMLInputElement>(null)
  const passwordField = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let userIDField_elm: HTMLInputElement | null = userIDField.current

      if (userIDField_elm) {
        userIDField_elm.focus()
      }
    }
  }, [mountHandled])

  /* -- COMPONENT FUNCTIONS -- */

  // This will force a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // Called to check if the form can be
  // submit.
  const canSubmit = (): boolean => {
    let elm_userIDField: HTMLInputElement | null = userIDField.current
    let elm_passwordField: HTMLInputElement | null = passwordField.current
    if (elm_userIDField && elm_passwordField) {
      let userID: string = elm_userIDField.value
      let password: string = elm_passwordField.value
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
  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()

    let elm_userIDField: HTMLInputElement | null = userIDField.current
    let elm_passwordField: HTMLInputElement | null = passwordField.current

    if (elm_userIDField && elm_passwordField) {
      let userID: string = elm_userIDField.value
      let password: string = elm_passwordField.value

      if (userID.length > 0 && password.length > 0) {
        setIsSubmitting(true)
        appActions.beginLoading('Logging in...')
        setErrorMessage(null)

        // Called when an error happens from
        // login that needs to be displayed
        // to the user.
        const handleLoginError = (errorMessage: string): void => {
          setIsSubmitting(false)
          setErrorMessage(errorMessage)
          appActions.finishLoading()
        }

        usersModule.login(
          userID,
          password,
          (correct: boolean, currentUser: IUser | null) => {
            if (correct && currentUser !== null) {
              setIsSubmitting(false)
              appActions.finishLoading()
              appState.setCurrentUser(currentUser)
              appActions.goToPage(
                props.returningPagePath,
                props.returningPageProps,
              )
            } else {
              handleLoginError('Incorrect username or password.')
            }
          },
          (error: AxiosError) => {
            if (error.response?.status === 400) {
              handleLoginError('400 Bad request.')
            } else {
              handleLoginError(
                'Something went wrong on our end. Please try again later.',
              )
            }
          },
        )
      } else {
        setErrorMessage('Please fill all fields.')
      }
    } else {
      setErrorMessage('Client error: Input elements not found in DOM.')
    }
  }

  const goBack = () => {
    appActions.goToPage(props.returningPagePath, props.returningPageProps)
  }

  /* -- RENDER -- */

  let submitIsDisabled: boolean = !canSubmit() || isSubmitting

  return (
    <div className='AuthPage Page'>
      <div className='Login'>
        <div className='ErrorMessage'>{errorMessage}</div>
        <div className='Header'>
          <div className='Heading'></div>
        </div>
        <form className='Form' onChange={handleChange} onSubmit={handleSubmit}>
          <input
            className='UserID Field'
            type='text'
            placeholder='Username'
            ref={userIDField}
          />
          <input
            className='Password Field'
            type='password'
            placeholder='Password'
            ref={passwordField}
          />
          <input
            className='Submit Button'
            type='submit'
            value='Login'
            disabled={submitIsDisabled}
          />
          <div className='Button' onClick={goBack}>
            Back
          </div>
        </form>
      </div>
    </div>
  )
}
