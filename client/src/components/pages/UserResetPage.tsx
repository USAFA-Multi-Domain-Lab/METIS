import { useGlobalContext } from '@client/context/global'
import { compute } from '@client/toolbox'
import {
  useEventListener,
  useForcedUpdates,
  useMountHandler,
  useRequireLogin,
} from '@client/toolbox/hooks'
import {
  PASSWORD_FORMAT_MESSAGE,
  PASSWORDS_MUST_MATCH_MESSAGE,
  useUserTextField,
} from '@client/toolbox/hooks/users'
import { UNMODIFIED_KEYSTROKES } from '@client/toolbox/keyboard'
import { ClientUser } from '@client/users/ClientUser'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import React, { useRef, useState } from 'react'
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
  const [areUnsubmittedChanges, setAreUnsubmittedChanges] =
    useState<boolean>(false)
  const navigationButtonEngine = useButtonSvgEngine({
    elements: [ProfileButton()],
  })

  /* -- REFS -- */

  const form = useRef<HTMLFormElement>(null)

  /* -- LOGIN-SPECIFIC LOGIC -- */

  const { user } = useRequireLogin()
  const forceUpdate = useForcedUpdates()

  /* -- HOOKS -- */

  const password = useUserTextField({
    user,
    property: 'password1',
    forceUpdate,
    isValid: (user) => user.hasValidPassword1,
    invalidMessage: PASSWORD_FORMAT_MESSAGE,
    onChange: () => setAreUnsubmittedChanges(true),
  })
  const confirmPassword = useUserTextField({
    user,
    property: 'password2',
    forceUpdate,
    isValid: (user) => user.hasValidPassword2,
    invalidMessage: PASSWORD_FORMAT_MESSAGE,
    onChange: () => setAreUnsubmittedChanges(true),
  })

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navigationButtonEngine, logoLinksHome: false }
  })

  /**
   * The error shown beneath the confirm password field. A problem with
   * the confirmed password itself takes priority over the two passwords
   * not matching.
   */
  const confirmPasswordErrorDisplayed = compute<string>(() => {
    if (StringToolbox.isFilled(confirmPassword.errorMessage)) {
      return confirmPassword.errorMessage
    }

    if (
      StringToolbox.isFilled(confirmPassword.value) &&
      password.value !== confirmPassword.value
    ) {
      return PASSWORDS_MUST_MATCH_MESSAGE
    }

    return ''
  })

  /**
   * Whether the submit button is disabled.
   */
  const submitDisabled = compute<TButtonTextDisabled>(() =>
    !areUnsubmittedChanges || !user.canSave ? 'full' : 'none',
  )

  /* -- EFFECTS -- */

  // componentDidMount
  useMountHandler(async (done) => {
    // Finish loading.
    finishLoading()
    done()
  })

  // Submit the form when enter is pressed away from it. Enter
  // inside the form submits it without any help.
  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (!UNMODIFIED_KEYSTROKES.enter.matches(event)) return
    if (form.current?.contains(event.target as Node)) return

    event.preventDefault()
    form.current?.requestSubmit()
  })

  /* -- FUNCTIONS -- */

  /**
   * This is called to submit the form.
   */
  const submit = async (): Promise<void> => {
    if (submitDisabled !== 'none') return
    setAreUnsubmittedChanges(false)

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

      setAreUnsubmittedChanges(true)
    }
  }

  /**
   * This is called when the password form is submitted, which happens
   * when the submit button is clicked and when enter is pressed
   * while a field has focus.
   */
  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    submit()
  }

  /* -- RENDER -- */

  return (
    <div className='UserResetPage Page'>
      <DefaultPageLayout navigation={navigation}>
        <form
          className='Form'
          onSubmit={handleSubmit}
          autoComplete='off'
          ref={form}
        >
          <div className='ResetUserEntry'>
            <DetailLocked label='Username' value={user.username} />
            <DetailString
              fieldType='required'
              label='New Password'
              value={password.value}
              setValue={password.setValue}
              errorMessage={password.errorMessage}
              inputType='password'
              placeholder='Enter a new password here...'
            />
            <DetailString
              fieldType='required'
              label='Confirm New Password'
              value={confirmPassword.value}
              setValue={confirmPassword.setValue}
              errorMessage={confirmPasswordErrorDisplayed}
              inputType='password'
              placeholder='Confirm your new password here...'
            />
          </div>

          <div className='Buttons'>
            <ButtonText
              type='submit'
              text={'Submit'}
              disabled={submitDisabled}
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
 * The props for the `UserResetPage` component.
 */
export type TUserResetPage = TPage_P & {}
