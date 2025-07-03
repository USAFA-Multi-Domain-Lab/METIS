import { useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import MetisInfo from 'src/info'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { DefaultPageLayout, TPage_P } from '.'
import Markdown, {
  MarkdownTheme as EMarkdownTheme,
} from '../content/general-layout/Markdown'
import {
  HomeButton,
  LogoutButton,
  TNavigation_P,
} from '../content/general-layout/Navigation'
import { useButtonSvgEngine } from '../content/user-controls/buttons/v3/hooks'
import './ChangelogPage.scss'

export interface IChangelogPage extends TPage_P {}

// This will render a page where a user can
// view all the changes made to the application.
export default function IChangelogPage({}: IChangelogPage): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [login] = globalContext.login
  const { beginLoading, finishLoading, handleError, navigateTo, logout } =
    globalContext.actions
  const [changelog, setChangelog] = useState<string>('')
  const navButtonEngine = useButtonSvgEngine({
    elements: [HomeButton(), LogoutButton()],
  })

  /* -- COMPONENT EFFECTS -- */

  useMountHandler(async (done) => {
    // Show loading page.
    beginLoading('Retrieving changelog...')

    // Fetch changelog.
    try {
      setChangelog(await MetisInfo.$fetchChangelog())
    } catch (error) {
      handleError('Failed to retrieve changelog.')
    }

    // Complete loading/mounting process.
    finishLoading()
    done()
  })

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine }
  })

  /* -- RENDER -- */

  return (
    <div className='ChangelogPage Page'>
      <DefaultPageLayout navigation={navigation} includeFooter={false}>
        <div className='Changelog'>
          <Markdown markdown={changelog} theme={EMarkdownTheme.ThemePrimary} />
        </div>
      </DefaultPageLayout>
    </div>
  )
}
