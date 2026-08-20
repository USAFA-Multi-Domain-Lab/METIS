import { LocalContext } from '@client/context/local'
import type {
  TMissionPage_C,
  TMissionPage_P,
  TMissionPage_S,
} from './MissionPage'

/**
 * Context for the mission page, which will help distribute
 * mission page properties to its children.
 */
export const missionPageContext = new LocalContext<
  TMissionPage_P,
  TMissionPage_C,
  TMissionPage_S,
  {}
>()

/**
 * Hook used by MissionPage-related components to access
 * the mission-page context.
 */
export const useMissionPageContext = missionPageContext.getHook()
