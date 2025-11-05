import ClientMissionForce from 'metis/client/missions/forces'
import type ArgMissionComponent from '../ArgMissionComponent'
import type ForceDropdown from '../dropdowns/ForceDropdown'

/**
 * Props from {@link ArgMissionComponent}
 */
export type TArgMissionComponent_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: TReactSetter<ClientEffect['args']>
}

/**
 * Base props for {@link ForceDropdown}
 */
export interface TForceDropdown_P_Base {
  /**
   * Whether the force is required.
   */
  required: boolean
  /**
   * Whether the force dropdown is currently
   * active.
   */
  active: boolean
  /**
   * The currently selected force.
   */
  force: ClientMissionForce | null
  /**
   * Selects a new force.
   */
  selectForce: TReactSetter<ClientMissionForce | null>
}

/**
 * Props for {@link ForceDropdown} when
 * the force is required.
 */
export interface TForceDropdown_P_Required extends TForceDropdown_P_Base {
  required: true
  force: ClientMissionForce
  selectForce: TReactSetter<ClientMissionForce>
}

/**
 * Props for {@link ForceDropdown} when
 * the force is optional.
 */
export interface TForceDropdown_P_Optional extends TForceDropdown_P_Base {
  required: false
  selection: ClientMissionForce | null
  select: TReactSetter<ClientMissionForce | null>
}

/**
 * Props for {@link ForceDropdown}.
 */
export type TForceDropdown_P =
  | TForceDropdown_P_Required
  | TForceDropdown_P_Optional
