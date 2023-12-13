import { useState } from 'react'
import './ChangelogPage.scss'
import { IPage } from '../App'
import Navigation from '../content/general-layout/Navigation'
import Markdown, {
  MarkdownTheme as EMarkdownTheme,
} from '../content/general-layout/Markdown'
import Info from 'src/info'
import { useGlobalContext } from 'src/context'
import { useMountHandler } from 'src/toolbox/hooks'

export interface IChangelogPage extends IPage {}

// This will render a page where a user can
// view all the changes made to the application.
export default function IChangelogPage({}: IChangelogPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [session] = globalContext.session
  const { beginLoading, finishLoading, handleError, goToPage, logout } =
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
              goToPage('HomePage', {})
            },
            visible: true,
          },
          {
            text: 'Log out',
            key: 'log-out',
            handleClick: () =>
              logout({
                returningPagePath: 'ChangelogPage',
                returningPageProps: {},
              }),
            visible: displayLogout,
          },
        ]}
        brandingCallback={() => goToPage('HomePage', {})}
        brandingTooltipDescription='Go home.'
      />
      <div className='Changelog'>
        <Markdown markdown={changelog} theme={EMarkdownTheme.ThemePrimary} />
      </div>
    </div>
  )
}
