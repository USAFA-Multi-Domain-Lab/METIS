import Footer from '../content/general-layout/Footer'
import Navigation, { TNavigation } from '../content/general-layout/Navigation'
import AuthPage from './AuthPage'
import ChangelogPage from './ChangelogPage'
import GameConfigPage from './GameConfigPage'
import GamePage from './GamePage'
import HomePage from './HomePage'
import MissionFormPage from './MissionFormPage'
import UserFormPage from './UserFormPage'
import UserResetPage from './UserResetPage'

/* -- constants -- */

/**
 * Registry for available pages in METIS.
 */
export const PAGE_REGISTRY = {
  BlankPage: () => null,
  AuthPage,
  HomePage,
  GameConfigPage,
  GamePage,
  UserResetPage,
  MissionFormPage,
  UserFormPage,
  ChangelogPage,
}

/* -- components -- */

/**
 * Wraps a page component with the default layout.
 */
export function DefaultLayout({
  children,
  navigation,
  includeFooter = true,
}: TDefaultLayout_P): JSX.Element | null {
  // Render.
  return (
    <>
      <Navigation {...navigation} />
      {children}
      {includeFooter ? <Footer /> : null}
    </>
  )
}

/* -- types -- */

/**
 * Props that every page accepts. Extend this to include more.
 */
export type TPage_P = {}

/**
 * Props for `DefaultLayout` component.
 */
export type TDefaultLayout_P = {
  /**
   * The nested JSX displayed in the layout.
   * @default undefined
   */
  children?: React.ReactNode
  /**
   * Props passed to navigation component.
   */
  navigation: TNavigation
  /**
   * Whether to include the footer.
   * @default true
   */
  includeFooter?: boolean
}
