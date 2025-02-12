import { useState } from 'react'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailNumber } from '../../form/DetailNumber'
import { ButtonText } from '../../user-controls/buttons/ButtonText'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of a mission prototype.
 */
export default function PrototypeEntry({
  prototype,
  prototype: { mission },
  handleChange,
  onAddRequest,
  onDeleteRequest,
}: TPrototypeEntry): JSX.Element | null {
  /* -- STATE -- */
  const [depthPadding, setDepthPadding] = useState<number>(
    prototype.depthPadding,
  )

  /* -- COMPUTED -- */
  /**
   * The class name for the delete prototype button.
   */
  const deleteClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

    // If the mission has only one node, add the disabled class.
    if (prototype && mission.prototypes.length < 2) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */
  // Sync the component state with the prototype node.
  usePostInitEffect(() => {
    prototype.depthPadding = depthPadding

    // Allow the user to save the changes.
    handleChange()
  }, [depthPadding])

  /* -- RENDER -- */

  return (
    <div className='Entry PrototypeEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={prototype} />
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelContent'>
          <DetailLocked
            label='ID'
            stateValue={prototype._id}
            key={`${prototype._id}_name`}
          />
          <DetailNumber
            fieldType='required'
            label='Depth Padding'
            stateValue={depthPadding}
            setState={setDepthPadding}
            integersOnly={true}
            key={`${prototype._id}_depthPadding`}
          />
          {/* -- BUTTON(S) -- */}
          <div className='ButtonContainer'>
            <ButtonText
              text='Add adjacent prototype'
              onClick={onAddRequest}
              tooltipDescription='Add one or multiple nodes adjacent to this node.'
            />
            <ButtonText
              text='Delete prototype'
              onClick={onDeleteRequest}
              tooltipDescription='Delete this node.'
              uniqueClassName={deleteClassName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR PROTOTYPE ENTRY ---------------------------- */

export type TPrototypeEntry = {
  /**
   * The prototype to be edited.
   */
  prototype: ClientMissionPrototype
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
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
