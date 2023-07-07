import React, { useEffect, useState } from 'react'
import './ChangelogPage.scss'
import { IPage } from '../App'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/general-layout/Navigation'
import Markdown, {
  MarkdownTheme as EMarkdownTheme,
} from '../content/general-layout/Markdown'
import { getChangelog } from '../../modules/info'

export interface IChangelogPage extends IPage {}

// This will render a page where a user can
// view all the changes made to the application.
export default function IChangelogPage(
  props: IChangelogPage,
): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [changelog, setChangelog] = useState<string>('')

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    appActions.beginLoading('Retrieving changelog...')

    if (!mountHandled) {
      getChangelog(
        (changelog: string) => {
          setChangelog(changelog)
          appActions.finishLoading()
        },
        (error: Error) => {
          appActions.handleServerError('Failed to retrieve changelog.')
          appActions.finishLoading()
        },
      )
    }
  }, [mountHandled])

  /* -- COMPONENT FUNCTIONS -- */

  // This will force a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // This will go back to the mission
  // selection page.
  const goBack = () => {
    appActions.goToPage('HomePage', {})
  }

  // This will logout the current user.
  const logout = () =>
    appActions.logout({
      returningPagePath: 'ChangelogPage',
      returningPageProps: {},
    })

  /* -- RENDER -- */

  // Keeps track of if the user is logged in or not.
  let displayLogin: boolean = appState.currentUser === null
  let displayLogout: boolean = !displayLogin

  return (
    <div className='ChangelogPage Page'>
      <Navigation
        links={[
          {
            text: 'Back to home',
            key: 'back-to-home',
            handleClick: () => {
              appActions.goToPage('HomePage', {})
            },
            visible: true,
          },
          {
            text: 'Log out',
            key: 'log-out',
            handleClick: logout,
            visible: displayLogout,
          },
        ]}
        brandingCallback={() => appActions.goToPage('HomePage', {})}
        brandingTooltipDescription='Go home.'
      />
      <div className='Changelog'>
        <Markdown markdown={changelog} theme={EMarkdownTheme.ThemePrimary} />
      </div>
    </div>
  )
}
