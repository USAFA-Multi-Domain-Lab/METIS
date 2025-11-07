import type { TMetisClientComponents } from '@client/index'
import type { TClientEffectHost } from '@client/missions/effects/ClientEffect'
import type {
  TEffectTrigger,
  TEffectType,
} from '@shared/missions/effects/Effect'
import type { MissionComponent } from '@shared/missions/MissionComponent'
import type { TNonEmptyArray } from '@shared/toolbox/arrays/ArrayToolbox'
import React, { useContext } from 'react'
import type { TMissionPage_P, TMissionPage_S } from './MissionPage'

/**
 * Context for the mission page, which will help distribute
 * mission page properties to its children.
 */
export const MissionPageContext =
  React.createContext<TMissionPageContextData | null>(null)

/**
 * Hook used by MissionPage-related components to access
 * the mission-page context.
 */
export const useMissionPageContext = () => {
  const context = useContext(
    MissionPageContext,
  ) as TMissionPageContextData | null
  if (!context) {
    throw new Error(
      'useMissionPageContext must be used within an mission-page provider',
    )
  }
  return context
}

/* -- TYPES -- */

/**
 * The mission-page context data provided to all children
 * of `MissionPage`.
 */
export type TMissionPageContextData = {
  /**
   * The ref for the root element of the mission page.
   */
  root: React.RefObject<HTMLDivElement | null>
} & Required<TMissionPage_P> & {
    /**
     * The state for the mission page.
     */
    state: TMissionPage_S
    /**
     * Callback for when a change has been made on the
     * page that would require saving.
     * @param components The components that have been changed.
     */
    onChange: (
      ...components: TNonEmptyArray<MissionComponent<TMetisClientComponents>>
    ) => void
    /**
     * Allows the creation of a custom effect by
     * opening a modal on the mission map which will
     * allow the user to create an effect from scratch.
     * @param host The host for which to create the effect.
     * @param trigger The trigger for the new effect.
     */
    activateEffectModal: <TType extends TEffectType>(
      host: TClientEffectHost<TType>,
      trigger: TEffectTrigger,
    ) => void
  }
