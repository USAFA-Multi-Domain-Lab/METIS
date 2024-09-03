import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import MetisInfo from 'src/info'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import Markdown, {
  MarkdownTheme as EMarkdownTheme,
} from '../content/general-layout/Markdown'
import {
  HomeLink,
  LogoutLink,
  TNavigation,
} from '../content/general-layout/Navigation'
import './ChangelogPage.scss'

export interface IChangelogPage extends TPage_P {}

// This will render a page where a user can
// view all the changes made to the application.
export default function IChangelogPage({}: IChangelogPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [login] = globalContext.login
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
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext), LogoutLink(globalContext)],
    }),
  )

  /* -- RENDER -- */

  return (
    <div className='ChangelogPage Page'>
      <DefaultLayout navigation={navigation} includeFooter={false}>
        <div className='Changelog'>
          <Markdown markdown={changelog} theme={EMarkdownTheme.ThemePrimary} />
        </div>
      </DefaultLayout>
    </div>
  )
}
