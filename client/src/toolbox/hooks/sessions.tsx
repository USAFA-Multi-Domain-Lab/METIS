import { useRef } from 'react'
import {
  TGlobalContextActions,
  TNavigateOptions,
  useGlobalContext,
} from 'src/context/global'
import SessionClient from 'src/sessions'
import { useEventListener, useMountHandler } from '.'

/**
 * Hook to monitor session state changes and handle redirects.
 * @param session The session to monitor for state changes.
 * @returns @see {@link TSessionRedirectsValue}
 */
export function useSessionRedirects(
  session: SessionClient,
  options: TSessionRedirectsOptions = {},
): TSessionRedirectsValue {
  const { returnPage = 'HomePage' } = options

  /* -- STATE -- */

  const globalContext = useGlobalContext()

  const [server] = globalContext.server
  const [currentPageKey] = globalContext.currentPageKey
  const { navigateTo, notify } = globalContext.actions

  /* -- FUNCTIONS -- */

  /**
   * Navigates to the return page based on the
   * `returnPage` prop.
   */
  const navigateToReturnPage = (options: TNavigateOptions = {}) => {
    if (returnPage === 'HomePage') {
      navigateTo('HomePage', {}, options)
    } else if (returnPage === 'MissionPage') {
      navigateTo('MissionPage', { missionId: session.mission._id }, options)
    }
  }

  /**
   * @see {@link TSessionRedirectsValue.verifyNavigation}
   */
  const verifyNavigation = useRef(() => {
    switch (session.state) {
      // Ensure that the user is on the lobby page
      // or the session-config page if the session
      // is unstarted.
      case 'unstarted':
        if (!['LobbyPage', 'SessionConfigPage'].includes(currentPageKey)) {
          navigateTo('LobbyPage', { session }, { bypassMiddleware: true })
        }
        break
      // Once starting, ensure the user is on the
      // lobby page.
      case 'starting':
        if (currentPageKey !== 'LobbyPage') {
          navigateTo('LobbyPage', { session }, { bypassMiddleware: true })

          // In case one manager starts the session
          // while another manager is configuring it,
          // notify of why the configuration was aborted.
          if (currentPageKey === 'SessionConfigPage') {
            notify(
              'Session configuration aborted. Session start was initiated by another manager.',
            )
          }
        }
        break
      // Once started, ensure the user is on the
      // session page. If resetting, stay on the
      // session page also.
      case 'started':
      case 'resetting':
        if (currentPageKey !== 'SessionPage') {
          navigateTo(
            'SessionPage',
            { session, returnPage: 'HomePage' },
            { bypassMiddleware: true },
          )
        }
        break
      // Once ending or ended, navigate to the
      // return page, most likely the home page.
      case 'ending':
      case 'ended':
        notify('Session is now closed.')
        navigateToReturnPage({ bypassMiddleware: true })
        break
      default:
        break
    }
  })

  /* -- EFFECTS -- */

  // Verify navigation on mount.
  useMountHandler((done) => {
    verifyNavigation.current()
    done()
  })

  // Listen for session state changes that potentially
  // could require a redirect.
  useEventListener(
    server,
    [
      'session-starting',
      'session-started',
      'session-ending',
      'session-ended',
      'session-destroyed',
      'session-resetting',
      'session-reset',
    ],
    () => {
      verifyNavigation.current()
    },
  )

  /* -- RENDER -- */

  return { verifyNavigation, navigateToReturnPage }
}

/* -- TYPES -- */

/**
 * Options for `useSessionRedirects` hook.
 */
export type TSessionRedirectsOptions = {
  /**
   * The return page to navigate to when the session ends.
   * @default 'HomePage'
   */
  returnPage?: 'HomePage' | 'MissionPage'
}

/**
 * Return value for `useSessionRedirects` hook.
 */
export type TSessionRedirectsValue = {
  /**
   * Ref to the function that verifies navigation.
   * Call this to confirm that the user is on the
   * correct page and redirect them if not. In most
   * cases, this will be handled automatically by
   * the hook.
   */
  verifyNavigation: React.MutableRefObject<() => void>
  /**
   * Redirects the user to the return page defined
   * in the options for the hook. By default, the
   * home page.
   * @param options Standard navigation options for
   * the {@link TGlobalContextActions.navigateTo} global
   * context action.
   */
  navigateToReturnPage: (options?: TNavigateOptions) => void
}
