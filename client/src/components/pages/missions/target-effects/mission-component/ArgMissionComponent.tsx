import DetailMultiSelect from '@client/components/content/form/dropdowns/multiselect/DetailMultiSelect'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { TMissionComponentArg2 } from '@shared/target-environments/args/mission-component/MissionComponentArg2'
import { useEffect, useState } from 'react'
import type { TMissionOutlineItem } from '../../structures/MissionOutline'
import MissionOutline from '../../structures/MissionOutline'

/**
 * Renders dropdowns for the argument whose type is `"force"`, `"node"`, `"action"`, `"file"`, `"pool"`, or `"resource"`.
 */
export default function ArgMissionComponent2({
  effect,
  effect: { mission, sourceForce, sourceNode, sourceAction },
  arg,
  arg: { _id, type, required },
  initialize,
  effectArgs,
  setEffectArgs,
}: TArgMissionComponent_P): TReactElement | null {
  const [value, setValue] = useState<TMissionOutlineItem[]>([])

  /* -- EFFECTS -- */

  useEffect(() => {
    if (initialize) {
    }
  }, [initialize])

  /* -- RENDER -- */

  return (
    <div className='ArgMissionComponent'>
      <DetailMultiSelect<TMissionOutlineItem>
        label={arg.name}
        value={value}
        setValue={setValue}
        getKey={({ _id }) => _id}
        render={({ name }) => name}
        options={[]}
        renderOptions={() => (
          <MissionOutline
            root={mission}
            selectionState={[value, setValue]}
            isSelectable={(item) => {
              return (
                item instanceof ClientMissionNode ||
                item instanceof ClientMissionAction
              )
            }}
            filter={(item) => {
              return (
                item instanceof ClientMissionForce ||
                item instanceof ClientMissionNode ||
                item instanceof ClientMissionAction
              )
            }}
            isIndirectlySelectable={(item, parent) => {
              return (
                item instanceof ClientMissionNode ||
                parent instanceof ClientMissionNode
              )
            }}
          />
        )}
      />
    </div>
  )
}

/* ---------------------------- TYPES FOR MISSION COMPONENT ---------------------------- */

/**
 * The props for the `ArgMissionComponent` component.
 */
type TArgMissionComponent_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg2
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
