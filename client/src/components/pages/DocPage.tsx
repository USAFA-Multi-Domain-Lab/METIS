import { useGlobalContext } from '@client/context/global'
import { MetisInfo } from '@client/info/MetisInfo'
import { compute } from '@client/toolbox'
import { useMountHandler } from '@client/toolbox/hooks'
import { useState } from 'react'
import { DefaultPageLayout } from '.'
import Markdown, {
  MarkdownTheme as EMarkdownTheme,
} from '../content/general-layout/Markdown'
import type { TNavigation_P } from '../content/general-layout/Navigation'
import { HomeButton, ProfileButton } from '../content/general-layout/Navigation'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './DocPage.scss'

/**
 * Displays documentation content such as credits
 * or changelog.
 */
export default function DocPage({ source }: TDocPage_P): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { beginLoading, finishLoading, handleError } = globalContext.actions
  const [doc, setDoc] = useState<string>('')
  const navButtonEngine = useButtonSvgEngine({
    elements: [HomeButton(), ProfileButton()],
  })

  /* -- EFFECTS -- */

  useMountHandler(async (done) => {
    // Show loading page.
    beginLoading('Retrieving document...')

    // Fetch doc.
    try {
      switch (source) {
        case 'changelog':
          setDoc(await MetisInfo.$fetchChangelog())
          break
        case 'credits':
          setDoc(await MetisInfo.$fetchCredits())
          break
        default:
          throw new Error('Invalid document source specified.')
      }
    } catch (error) {
      handleError('Failed to retrieve document.')
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
    <div className='DocPage Page'>
      <DefaultPageLayout navigation={navigation} includeFooter={false}>
        <div className='Doc'>
          <Markdown markdown={doc} theme={EMarkdownTheme.ThemePrimary} />
        </div>
      </DefaultPageLayout>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link DocPage}.
 */
export type TDocPage_P = {
  /**
   * The document to load into the page.
   */
  source: 'changelog' | 'credits'
}
