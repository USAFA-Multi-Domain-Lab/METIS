import { useGlobalContext } from 'src/context'
import Navigation from '../content/general-layout/Navigation'
import './ChangelogPage.scss'

export default function GameConfigPage({}: TGameConfigPage_P): JSX.Element | null {
  const globalContext = useGlobalContext()
  const { navigateTo, logout } = globalContext.actions

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
            visible: true,
          },
        ]}
        brandingCallback={() => navigateTo('HomePage', {})}
        brandingTooltipDescription='Go home.'
      />
    </div>
  )
}

/**
 * Props for `GameConfigPage` component.
 */
export type TGameConfigPage_P = {}
