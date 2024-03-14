import AuthPage from './AuthPage'
import ChangelogPage from './ChangelogPage'
import GameConfigPage from './GameConfigPage'
import GamePage from './GamePage'
import HomePage from './HomePage'
import MissionFormPage from './MissionFormPage'
import UserFormPage from './UserFormPage'
import UserResetPage from './UserResetPage'

/**
 * Props that every page accepts. Extend this to include more.
 */
export type TPage_P = {}

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
