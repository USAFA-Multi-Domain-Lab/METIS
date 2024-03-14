import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import Info from 'src/info'
import { useMountHandler } from 'src/toolbox/hooks'
import { TPage_P } from '.'
import Markdown, {
  MarkdownTheme as EMarkdownTheme,
} from '../content/general-layout/Markdown'
import Navigation from '../content/general-layout/Navigation'
import './ChangelogPage.scss'

export interface IChangelogPage extends TPage_P {}

// This will render a page where a user can
// view all the changes made to the application.
export default function IChangelogPage({}: IChangelogPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [session] = globalContext.session
  const { beginLoading, finishLoading, handleError, navigateTo, logout } =
    globalContext.actions

  /* -- COMPONENT STATE -- */

  const [changelog, setChangelog] = useState<string>('')

  /* -- COMPONENT EFFECTS -- */

  useMountHandler(async (done) => {
    // Show loading page.
    beginLoading('Retrieving changelog...')

    // Fetch changelog.
    try {
      setChangelog(await Info.fetchChangelog())
    } catch (error) {
      handleError('Failed to retrieve changelog.')
    }

    // Complete loading/mounting process.
    finishLoading()
    done()
  })

  /* -- RENDER -- */

  // Keeps track of if the user is logged in or not.
  let displayLogin: boolean = session === null
  let displayLogout: boolean = !displayLogin

  return (
    <div className='ChangelogPage Page'>
      <Navigation
        links={[
          {
            text: 'Back to home',
            key: 'back-to-home',
            handleClick: () => {
              navigateTo('HomePage', {})
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
        brandingCallback={() => navigateTo('HomePage', {})}
        brandingTooltipDescription='Go home.'
      />
      <div className='Changelog'>
        <Markdown markdown={changelog} theme={EMarkdownTheme.ThemePrimary} />
      </div>
    </div>
  )
}
