import { useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useMountHandler, usePostInitEffect } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultPageLayout, TPage_P } from '.'
import { DetailLocked } from '../content/form/DetailLocked'
import { DetailString } from '../content/form/DetailString'
import {
  LogoutButton,
  TNavigation_P,
} from '../content/general-layout/Navigation'
import {
  ButtonText,
  TButtonTextDisabled,
} from '../content/user-controls/buttons/ButtonText'
import { useButtonSvgEngine } from '../content/user-controls/buttons/v3/hooks'
import './UserResetPage.scss'

/**
 * This page allows the user to reset their password.
 */
export default function UserResetPage(): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { notify, navigateTo, finishLoading } = globalContext.actions
  const [login] = globalContext.login
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [userEmptyStringArray, setUserEmptyStringArray] = useState<string[]>([])
  const [handlePassword1Error, setHandlePassword1Error] =
    useState<THandleOnBlur>('deliverError')
  const [handlePassword2Error, setHandlePassword2Error] =
    useState<THandleOnBlur>('deliverError')
  const [password1ErrorMessage, setPassword1ErrorMessage] = useState<string>()
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState<string>()
  const [password1, setPassword1] = useState<string>('')
  const [password2, setPassword2] = useState<string>('')
  const navButtonEngine = useButtonSvgEngine({
    elements: [LogoutButton()],
  })

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
      setHandlePassword1Error('none')
      setAreUnsavedChanges(true)
    }

    if (password1 === '') {
      setHandlePassword1Error('deliverError')
      setPassword1ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password1`])
    }

    if (!user.hasValidPassword1 && password1 !== '') {
      setHandlePassword1Error('deliverError')
      setPassword1ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    // If the user has entered a password in the second password field,
    // check to see if the two passwords match.
    if (!user.passwordsMatch && user.password2) {
      setHandlePassword2Error('deliverError')
      setPassword2ErrorMessage('Passwords must match.')
    }
    // If the user has entered a password in the second password field
    // and the two passwords match, remove the error.
    else if (user.passwordsMatch && user.password2) {
      setHandlePassword2Error('none')
    }
  }, [password1])

  // Sync the component state with the user password2 property.
  usePostInitEffect(() => {
    user.password2 = password2

    if (user.hasValidPassword2 && password2 !== '') {
      removeUserEmptyString('password2')
      setHandlePassword2Error('none')
      setAreUnsavedChanges(true)
    }

    if (!user.hasValidPassword2 && password2 !== '') {
      setHandlePassword2Error('deliverError')
      setPassword2ErrorMessage(
        'Password must be between 8 and 50 characters and cannot contain spaces.',
      )
    }

    if (password2 === '') {
      setHandlePassword2Error('deliverError')
      setPassword2ErrorMessage('At least one character is required here.')
      setUserEmptyStringArray([...userEmptyStringArray, `field=password2`])
    }

    if (user.hasValidPassword2 && password2 !== '' && !user.passwordsMatch) {
      setHandlePassword2Error('deliverError')
      setPassword2ErrorMessage('Passwords must match.')
    }
  }, [password2])

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  if (login === null) {
    return null
  }

  // Grab the user currently logged in.
  const { user } = login

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
  const isEmptyString: boolean = compute(() => userEmptyStringArray.length > 0)

  /**
   * Whether the save button is disabled.
   */
  const saveDisabled: TButtonTextDisabled = compute(() =>
    !areUnsavedChanges || isEmptyString || !user.canSave ? 'full' : 'none',
  )

  /* -- FUNCTIONS -- */

  /**
   * This is called to save any changes made.
   */
  const save = async (): Promise<void> => {
    if (areUnsavedChanges) {
      setAreUnsavedChanges(false)

      try {
        await ClientUser.$resetPassword(user)
        notify('Password reset successfully.')
        navigateTo('HomePage', {})
      } catch (error: any) {
        notify('Failed to reset password.')
        setAreUnsavedChanges(true)
      }
    }
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
        <div className='ResetUserEntry'>
          <DetailLocked label='Username' stateValue={user.username} />
          <DetailString
            fieldType='required'
            handleOnBlur={handlePassword1Error}
            label='New Password'
            value={password1}
            setValue={setPassword1}
            errorMessage={password1ErrorMessage}
            inputType='password'
            placeholder='Enter a new password here...'
          />
          <DetailString
            fieldType='required'
            handleOnBlur={handlePassword2Error}
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
            text={'Save'}
            disabled={saveDisabled}
            onClick={() => save()}
          />
        </div>
      </DefaultPageLayout>
    </div>
  )
}

/* ---------------------------- TYPES FOR USER RESET PAGE ---------------------------- */

/**
 * The props for the UserResetPage component.
 */
export interface IUserResetPage extends TPage_P {}

/**
 * The type of handleOnBlur.
 */
type THandleOnBlur = 'deliverError' | 'none'
