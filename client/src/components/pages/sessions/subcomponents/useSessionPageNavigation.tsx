import Prompt from '@client/components/content/communication/Prompt'
import type { TNavigation_P } from '@client/components/content/general-layout/Navigation'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useGlobalContext } from '@client/context/global'
import { compute } from '@client/toolbox'
import { useSessionRedirects } from '@client/toolbox/hooks/sessions'
import { DefaultPageLayout } from '../..'
import type { TSessionPage_P } from '../SessionPage'
import SessionPage from '../SessionPage'

/**
 * Hook that manages most of the logic for the navigation
 * on the {@link SessionPage}.
 * @param sessionPageProps Props passed to the {@link SessionPage}
 * which already have had any optional properties set to their default
 * settings, nothing here should be undefined.
 * @returns The navigation settings to pass to {@link DefaultPageLayout},
 * the button engine, used to dynamically manage buttons in the navigation
 * based on certain event, and an initializer function to call on mount.
 */
export function useSessionPageNavigation(
  sessionPageProps: Required<TSessionPage_P>,
) {
  const { session, returnPage } = sessionPageProps
  const globalContext = useGlobalContext()
  const {
    navigateTo,
    finishLoading,
    notify,
    prompt,
    handleError,
    beginLoading,
  } = globalContext.actions

  const { verifyNavigation, navigateToReturnPage } = useSessionRedirects(
    session,
    { returnPage },
  )

  const navigationButtonEngine = useButtonSvgEngine({
    elements: [],
  })

  const navigation = compute<TNavigation_P>(() => {
    return {
      buttonEngine: navigationButtonEngine,
      logoLinksHome: false,
    }
  })

  /**
   * Initializes the navigation for the session page
   * based on the context for which it is being used.
   */
  const initializeNavigation = () => {
    let { isTest } = session.config
    let canStartEndSessions = session.member.isAuthorized('startEndSessions')

    /**
     * Adds a button to the navigation that will reset the progress
     * in the session.
     * @param description The text to display on the button when
     * hovered over.
     */
    const addResetSession = (description: string = 'Reset session') => {
      navigationButtonEngine.add({
        key: 'reset',
        type: 'button',
        icon: 'reset',
        description,
        onClick: onClickResetSession,
      })
    }

    /**
     * Callback for the end session button.
     */
    const onClickEndSession = async () => {
      // If the session is not started, verify navigation.
      if (session.state !== 'started') {
        verifyNavigation.current()
        return
      }

      // Confirm the user wants to end the session.
      let { choice } = await prompt(
        'Please confirm ending the session.',
        Prompt.ConfirmationChoices,
      )

      // If the user cancels, return.
      if (choice === 'Cancel') {
        return
      }

      try {
        // Clear verify navigation function to prevent double
        // redirect.
        verifyNavigation.current = () => {}
        // Begin loading.
        beginLoading('Ending session...')
        // End the session.
        await session.$end({
          onInit: () => {
            // Go to return page once the session
            // end has been initiated. Tear down
            // does not need to hold up navigation.
            navigateToReturnPage({ bypassMiddleware: true })
          },
        })
        notify(
          `"${session.name}" teardown complete. Session will now be deleted.`,
        )
      } catch (error) {
        handleError({
          message: 'Failed to end session.',
          notifyMethod: 'bubble',
        })
      }
    }

    /**
     * Callback for the reset session button.
     */
    const onClickResetSession = async () => {
      // If the session is not started, verify navigation.
      if (session.state !== 'started') {
        verifyNavigation.current()
        return
      }

      // Confirm the user wants to reset the session.
      let { choice } = await prompt(
        'Please confirm resetting the session.',
        Prompt.ConfirmationChoices,
      )

      // If the user cancels, return.
      if (choice === 'Cancel') {
        return
      }

      try {
        // Clear verify navigation function to prevent double
        // redirect.
        verifyNavigation.current = () => {}
        // Start the session.
        await session.$reset()
        // Refresh page.
        navigateTo(
          'SessionPage',
          { session, returnPage },
          { bypassMiddleware: true },
        )
        // Finish loading.
        finishLoading()
      } catch (error) {
        handleError({
          message: 'Failed to reset session.',
          notifyMethod: 'bubble',
        })
      }
    }

    /**
     *  Adds a button to the navigation to end the session.
     * @param description The text to display on the button when
     * hovered over.
     */
    const addEndSession = (description: string = 'End Session') => {
      navigationButtonEngine.add({
        key: 'stop',
        type: 'button',
        icon: 'stop',
        description,
        onClick: onClickEndSession,
      })
    }

    /**
     * Adds a button to the navigation to quit the session.
     * @param description The text to display on the button when
     * hovered over.
     * @param destination The destination to navigate to when quitting.
     */
    const addQuit = (description: string = 'Quit') => {
      navigationButtonEngine.add({
        key: 'quit',
        type: 'button',
        icon: 'quit',
        description,
        onClick: () => {
          navigateToReturnPage()
        },
      })
    }

    // Add links based on whether this is a play-test session.
    if (isTest) {
      // Add reset link and a quit link that
      // navigates back to the mission page.
      if (canStartEndSessions) addResetSession('Reset play-test')
      addQuit('Quit play-test')
    } else {
      // Add reset and end session links if the member
      // is authorized. Then add the quit link.
      if (canStartEndSessions) {
        addEndSession()
        addResetSession()
      }
      addQuit()
    }
  }

  return {
    navigation,
    navigationButtonEngine,
    initializeNavigation,
  }
}
