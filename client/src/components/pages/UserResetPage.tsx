import { useGlobalContext } from '@client/context/global'
import { compute } from '@client/toolbox'
import {
  useEventListener,
  useMountHandler,
  usePostInitEffect,
  useRequireLogin,
} from '@client/toolbox/hooks'
import { KEYBOARD_SHORTCUTS } from '@client/toolbox/keyboard'
import { ClientUser } from '@client/users/ClientUser'
import React, { useState } from 'react'
import type { TPage_P } from '.'
import { DefaultPageLayout } from '.'
import { DetailLocked } from '../content/form/DetailLocked'
import { DetailString } from '../content/form/DetailString'
import type { TNavigation_P } from '../content/general-layout/Navigation'
import { ProfileButton } from '../content/general-layout/Navigation'
import type { TButtonTextDisabled } from '../content/user-controls/buttons/ButtonText'
import { ButtonText } from '../content/user-controls/buttons/ButtonText'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './UserResetPage.scss'

/**
 * This page allows the user to reset their password.
 */
export default function UserResetPage(): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { notify, navigateTo, finishLoading } = globalContext.actions
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [userEmptyStringArray, setUserEmptyStringArray] = useState<string[]>([])
  const [password1ErrorMessage, setPassword1ErrorMessage] = useState<string>()
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState<string>()
  const [password1, setPassword1] = useState<string>('')
  const [password2, setPassword2] = useState<string>('')
  const navButtonEngine = useButtonSvgEngine({
    elements: [ProfileButton()],
  })

  /* -- LOGIN-SPECIFIC LOGIC -- */

  const { user } = useRequireLogin()

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine, logoLinksHome: false }
  })

  /**
   * Boolean to determine if there are any fields with empty strings.
   */
  const isEmptyString = compute<boolean>(() => userEmptyStringArray.length > 0)

  /**
   * Whether the save button is disabled.
   */
  const saveDisabled = compute<TButtonTextDisabled>(() =>
    !areUnsavedChanges || isEmptyString || !user.canSave ? 'full' : 'none',
  )

  /* -- EFFECTS -- */

  // componentDidMount
  useMountHandler(async (done) => {
    // Finish loading.
    finishLoading()
    setPassword1(user.password1 || '')
    setPassword2(user.password2 || '')
    done()
  })

  // Sync the component state with the user password1 property.
  usePostInitEffect(() => {
    user.password1 = password1

    if (user.hasValidPassword1 && password1 !== '') {
      removeUserEmptyString('password1')
      setPassword1ErrorMessage('')
      setAreUnsavedChanges(true)
    }

    if (password1 === '') {
      setPassword1ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password1`])
    }

    if (!user.hasValidPassword1 && password1 !== '') {
      setPassword1ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    // If the user has entered a password in the second password field,
    // check to see if the two passwords match.
    if (!user.passwordsMatch && user.password2) {
      setPassword2ErrorMessage('Passwords must match.')
    }
    // If the user has entered a password in the second password field
    // and the two passwords match, remove the error.
    else if (user.passwordsMatch && user.password2) {
      setPassword2ErrorMessage('')
    }
  }, [password1])

  // Sync the component state with the user password2 property.
  usePostInitEffect(() => {
    user.password2 = password2

    if (user.hasValidPassword2 && password2 !== '') {
      removeUserEmptyString('password2')
      setPassword2ErrorMessage('')
      setAreUnsavedChanges(true)
    }

    if (!user.hasValidPassword2 && password2 !== '') {
      setPassword2ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    if (password2 === '') {
      setPassword2ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password2`])
    }

    if (user.hasValidPassword2 && password2 !== '' && !user.passwordsMatch) {
      setPassword2ErrorMessage('Passwords must match.')
    }
  }, [password2])

  // Save the new password when the save shortcut is pressed. The keystroke
  // is always taken over, so the browser's own save dialog stays away even
  // when there is nothing to save.
  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (!KEYBOARD_SHORTCUTS.save.matches(event)) return

    event.preventDefault()
    if (areUnsavedChanges) save()
  })

  /* -- FUNCTIONS -- */

  /**
   * This is called to save any changes made.
   */
  const save = async (): Promise<void> => {
    if (saveDisabled !== 'none') return
    setAreUnsavedChanges(false)

    try {
      await ClientUser.$resetPassword(user)
      notify('Password reset successfully.')
      navigateTo('HomePage', {})
    } catch (error: any) {
      if (error.status && error.status === 422) {
        notify(
          'Make sure the new password is different from the old password. Enter a different password and try again.',
        )
      } else {
        notify('Failed to reset password.')
      }

      setAreUnsavedChanges(true)
    }
  }

  /**
   * This is called when the password form is submitted, which happens
   * when the save button is clicked and when enter is pressed
   * while a field has focus.
   */
  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    save()
  }

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
    <div className='UserResetPage Page'>
      <DefaultPageLayout navigation={navigation}>
        <form className='Form' onSubmit={handleSubmit} autoComplete='off'>
          <div className='ResetUserEntry'>
            <DetailLocked label='Username' value={user.username} />
            <DetailString
              fieldType='required'
              label='New Password'
              value={password1}
              setValue={setPassword1}
              errorMessage={password1ErrorMessage}
              inputType='password'
              placeholder='Enter a new password here...'
            />
            <DetailString
              fieldType='required'
              label='Confirm New Password'
              value={password2}
              setValue={setPassword2}
              errorMessage={password2ErrorMessage}
              inputType='password'
              placeholder='Confirm your new password here...'
            />
          </div>

          <div className='Buttons'>
            <ButtonText
              type='submit'
              text={'Save'}
              disabled={saveDisabled}
              onClick={() => {}}
            />
          </div>
        </form>
      </DefaultPageLayout>
    </div>
  )
}

/* ---------------------------- TYPES FOR USER RESET PAGE ---------------------------- */

/**
 * The props for the UserResetPage component.
 */
export interface IUserResetPage extends TPage_P {}
