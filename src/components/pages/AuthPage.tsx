// This will render the interface for booking a

import React, { useEffect, useRef, useState } from 'react'
import './AuthPage.scss'
import usersModule, { IUser } from '../../modules/users'
import { AxiosError } from 'axios'
import { useStore } from 'react-context-hook'

// This will render a page where a user can
// login to view the radar.
export default function AuthPage(props: { show: boolean }): JSX.Element | null {
  /* -- GLOBAL STATE -- */

  const [currentUser, setCurrentUser] = useStore('currentUser')
  const [currentPagePath, setCurrentPagePath] = useStore('currentPagePath')
  const [loadingMessage, setLoadMessage] = useStore('loadingMessage')

  /* -- COMPONENT REFS -- */

  const userIDField = useRef<HTMLInputElement>(null)
  const passwordField = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)

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
        setLoadMessage('Logging in...')
        setErrorMessage(null)

        // Called when an error happens from
        // login that needs to be displayed
        // to the user.
        const handleLoginError = (errorMessage: string): void => {
          setIsSubmitting(false)
          setErrorMessage(errorMessage)
          setLoadMessage(null)
        }

        usersModule.login(
          userID,
          password,
          (correct: boolean, currentUser: IUser | null) => {
            if (correct && currentUser !== null) {
              setIsSubmitting(false)
              setLoadMessage(null)
              setCurrentUser(currentUser)
              setCurrentPagePath('DashboardPage')
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

  /* -- RENDER -- */

  let show: boolean = props.show
  let submitIsDisabled: boolean = !canSubmit() || isSubmitting

  if (show && currentUser === null) {
    return (
      <div className='AuthPage'>
        <div className='Login'>
          <div className='ErrorMessage'>{errorMessage}</div>
          <div className='Header'>
            <div className='Heading'>MDL</div>
          </div>
          <form
            className='Form'
            onChange={handleChange}
            onSubmit={handleSubmit}
          >
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
              className='Submit'
              type='submit'
              value='Login'
              disabled={submitIsDisabled}
            />
          </form>
        </div>
      </div>
    )
  } else {
    return null
  }
}
