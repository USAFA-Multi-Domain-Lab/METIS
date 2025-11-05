import { useButtonSvgEngine } from 'metis/client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from 'metis/client/components/pages/missions/context'
import usePrototypeItemButtonCallbacks from 'metis/client/components/pages/missions/hooks/mission-components/prototypes'
import ClientMissionPrototype from 'metis/client/missions/nodes/prototypes'
import { usePostInitEffect } from 'metis/client/toolbox/hooks'
import { useState } from 'react'
import { DetailLocked } from '../../../../content/form/DetailLocked'
import { DetailNumber } from '../../../../content/form/DetailNumber'
import Entry from '../Entry'

/**
 * This will render the basic editable details of a mission prototype.
 */
export default function PrototypeEntry({
  prototype,
  prototype: { mission },
}: TPrototypeEntry): TReactElement | null {
  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const { onAddRequest, onDeleteRequest } = usePrototypeItemButtonCallbacks()
  const [depthPadding, setDepthPadding] = useState<number>(
    prototype.depthPadding,
  )
  const svgEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'add',
        type: 'button',
        icon: 'add',
        description:
          'Add one or multiple nodes adjacent to this prototype node',
        permissions: ['missions_write'],
        onClick: () => onAddRequest(prototype),
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete prototype node',
        disabled: mission.prototypes.length < 2,
        permissions: ['missions_write'],
        onClick: () => onDeleteRequest(prototype),
      },
    ],
  })

  /* -- EFFECTS -- */
  // Sync the component state with the prototype node.
  usePostInitEffect(() => {
    prototype.depthPadding = depthPadding

    // Allow the user to save the changes.
    onChange(prototype)
  }, [depthPadding])

  /* -- RENDER -- */

  return (
    <Entry missionComponent={prototype} svgEngines={[svgEngine]}>
      <DetailLocked
        label='ID'
        stateValue={prototype._id}
        key={`${prototype._id}_name`}
      />
      <DetailNumber
        fieldType='required'
        label='Depth Padding'
        value={depthPadding}
        setValue={setDepthPadding}
        integersOnly={true}
        key={`${prototype._id}_depthPadding`}
      />
    </Entry>
  )
}

/* ---------------------------- TYPES FOR PROTOTYPE ENTRY ---------------------------- */

export type TPrototypeEntry = {
  /**
   * The prototype to be edited.
   */
  prototype: ClientMissionPrototype
}
