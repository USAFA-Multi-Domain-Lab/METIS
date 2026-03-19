import { LocalContext } from '@client/context/local'
import type {
  TDetailIconSelector_C,
  TDetailIconSelector_P,
} from './DetailIconSelector'
import { DetailIconSelector } from './DetailIconSelector'

/**
 * Local context for the {@link DetailIconSelector} component, distributing
 * props, computed values, state, and element refs to its subcomponents.
 */
export const detailIconSelectorContext = new LocalContext<
  TDetailIconSelector_P,
  TDetailIconSelector_C,
  {},
  {}
>()

/**
 * Hook used by {@link DetailIconSelector} subcomponents to access
 * the detail-icon-selector context.
 */
export const useDetailIconSelectorContext = detailIconSelectorContext.getHook()
