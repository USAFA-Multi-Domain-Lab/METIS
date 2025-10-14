import { TMetisClientComponents } from 'src'
import { TCreateEffect_P } from 'src/components/content/session/mission-map/ui/overlay/modals/CreateEffect'
import ClientFileReference from 'src/files/references'
import ClientMission from 'src/missions'
import ClientMissionFile from 'src/missions/files'
import { TPage_P } from '..'
import MissionComponent, {
  TMissionComponentDefect,
} from '../../../../../shared/missions/component'
import { TEffectExecutionTriggered } from '../../../../../shared/missions/effects'
import { TNonEmptyArray } from '../../../../../shared/toolbox/arrays'

export interface TMissionPage_P extends TPage_P {
  /**
   * The ID of the mission to be edited. If null,
   * a new mission is being created.
   */
  missionId: string | null
}

/**
 * The state for `MissionPage`, provided
 * in the context.
 */
export type TMissionPage_S = {
  /**
   * The current mission being viewed/edited.
   */
  mission: TReactState<ClientMission>
  /**
   * The current selection within the mission.
   */
  selection: TReactState<MissionComponent<TMetisClientComponents>>
  /**
   * The defects within mission components that must
   * be addressed for the mission to function correctly.
   */
  defects: TReactState<TMissionComponentDefect[]>
  /**
   * Triggers a recomputation of the defective
   * components, updating the state with the result.
   */
  checkForDefects: TReactState<boolean>
  /**
   * The current list of files available in the store.
   */
  globalFiles: TReactState<ClientFileReference[]>
  /**
   * The current list of files attached to the mission.
   */
  localFiles: TReactState<ClientMissionFile[]>
  /**
   * Whether the effect modal is currently active.
   */
  effectModalActive: TReactState<boolean>
  /**
   * Arguments to pass to the effect modal when active.
   */
  effectModalArgs: TReactState<Pick<TCreateEffect_P, 'host' | 'trigger'>>
}

/**
 * The mission-page context data provided to all children
 * of `MissionPage`.
 */
export type TMissionPageContextData = {
  /**
   * The ref for the root element of the mission page.
   */
  root: React.RefObject<HTMLDivElement>
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
    activateEffectModal: (
      host: TClientEffectHost,
      trigger: TEffectExecutionTriggered,
    ) => void
  }
