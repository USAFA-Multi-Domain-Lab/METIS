import DetailMultiSelect from '@client/components/content/form/dropdowns/multiselect/DetailMultiSelect'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { TMissionComponentArg2 } from '@shared/target-environments/args/mission-component/MissionComponentArg2'
import { useEffect, useState } from 'react'
import type { TMissionOutlineItem } from '../../structures/MissionOutline'
import MissionOutline, {
  computeOutlineIconStyling,
} from '../../structures/MissionOutline'
import './ArgMissionComponent.scss'

/**
 * Renders dropdowns for the argument whose type is `"force"`, `"node"`, `"action"`, `"file"`, `"pool"`, or `"resource"`.
 */
export default function ArgMissionComponent2({
  effect,
  effect: { mission, sourceForce, sourceNode, sourceAction },
  arg,
  arg: { _id, type, required, tooltipDescription },
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
        tooltipDescription={tooltipDescription}
        value={value}
        setValue={setValue}
        getKey={({ _id }) => _id}
        render={(item) => {
          return (
            <div className='ComponentItemContent'>
              <div
                className='Icon'
                style={computeOutlineIconStyling(item)}
              ></div>
              <div className='Name'>{item.name}</div>
            </div>
          )
        }}
        options={[]}
        renderOptions={() => (
          <MissionOutline
            root={mission}
            selectionState={[value, setValue]}
            isSelectable={(item) => {
              return (
                item instanceof ClientMission ||
                item instanceof ClientMissionForce ||
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
              let isNode = item instanceof ClientMissionNode
              let parentIsNode = parent instanceof ClientMissionNode
              return !isNode || !parentIsNode
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
