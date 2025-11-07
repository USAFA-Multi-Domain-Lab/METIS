import { useGlobalContext } from '@client/context/global'
import { MetisInfo } from '@client/info/MetisInfo'
import { compute } from '@client/toolbox'
import { useMountHandler } from '@client/toolbox/hooks'
import { useState } from 'react'
import type { TPage_P } from '.'
import { DefaultPageLayout } from '.'
import Markdown, {
  MarkdownTheme as EMarkdownTheme,
} from '../content/general-layout/Markdown'
import type { TNavigation_P } from '../content/general-layout/Navigation'
import { HomeButton, ProfileButton } from '../content/general-layout/Navigation'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './ChangelogPage.scss'

export interface IChangelogPage extends TPage_P {}

// This will render a page where a user can
// view all the changes made to the application.
export default function ChangelogPage({}: IChangelogPage): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [login] = globalContext.login
  const { beginLoading, finishLoading, handleError, navigateTo, logout } =
    globalContext.actions
  const [changelog, setChangelog] = useState<string>('')
  const navButtonEngine = useButtonSvgEngine({
    elements: [HomeButton(), ProfileButton()],
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
