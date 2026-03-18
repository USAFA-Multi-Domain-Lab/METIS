import { LocalContext } from '@client/context/local'
import type {
  TSessionPage_C,
  TSessionPage_E,
  TSessionPage_P,
  TSessionPage_S,
} from './SessionPage'

/**
 * Local context for the {@link SessionPage} component, distributing
 * props, computed values, state, and element refs to its subcomponents.
 */
export const sessionPageContext = new LocalContext<
  TSessionPage_P,
  TSessionPage_C,
  TSessionPage_S,
  TSessionPage_E
>()

/**
 * Hook used by SessionPage subcomponents to access
 * the session-page context.
 */
export const useSessionPageContext = sessionPageContext.getHook()
