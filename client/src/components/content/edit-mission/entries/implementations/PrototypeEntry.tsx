import { useState } from 'react'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { DetailLocked } from '../../../form/DetailLocked'
import { DetailNumber } from '../../../form/DetailNumber'
import Entry from '../Entry'

/**
 * This will render the basic editable details of a mission prototype.
 */
export default function PrototypeEntry({
  prototype,
  prototype: { mission },
  onChange,
  onAddRequest,
  onDeleteRequest,
}: TPrototypeEntry): JSX.Element | null {
  /* -- STATE -- */

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
        onClick: onAddRequest,
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete prototype node',
        disabled: mission.prototypes.length < 2,
        permissions: ['missions_write'],
        onClick: onDeleteRequest,
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
  /**
   * A callback that will be used to notify the parent
   * component that this component has changed.
   * @param prototype The same prototype passed.
   */
  onChange: (prototype: ClientMissionPrototype) => void
  /**
   * A function that will be called when the user
   * requests to add a new prototype.
   */
  onAddRequest: () => void
  /**
   * A function that will be called when the user
   * requests to delete this prototype.
   */
  onDeleteRequest: () => void
}
