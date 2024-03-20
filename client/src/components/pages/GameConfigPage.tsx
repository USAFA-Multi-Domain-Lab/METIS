import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { DefaultLayout } from '.'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import './ChangelogPage.scss'

export default function GameConfigPage({}: TGameConfigPage_P): JSX.Element | null {
  const globalContext = useGlobalContext()
  const { navigateTo, logout } = globalContext.actions

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [{ ...HomeLink(globalContext), text: 'Cancel Launch' }],
      boxShadow: 'alt-7',
    }),
  )

  return (
    <div className='ChangelogPage Page'>
      <DefaultLayout navigation={navigation}></DefaultLayout>
    </div>
  )
}

/**
 * Props for `GameConfigPage` component.
 */
export type TGameConfigPage_P = {
  /**
   * The ID of the game to configure.
   */
}
