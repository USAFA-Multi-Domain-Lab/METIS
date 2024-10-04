import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { compute } from 'src/toolbox'
import { DetailLocked } from '../../form/DetailLocked'
import { ButtonText } from '../../user-controls/buttons/ButtonText'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of a mission prototype.
 */
export default function PrototypeEntry({
  prototype,
  handleChange,
  onAddRequest,
  onDeleteRequest,
}: TPrototypeEntry): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  /* -- STATE -- */

  /* -- COMPUTED -- */

  const mission = prototype.mission

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

  /* -- FUNCTIONS -- */

  /* -- RENDER -- */

  return (
    <div className='Entry PrototypeEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={prototype} />
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelSection MainDetails'>
          <DetailLocked
            label='ID'
            stateValue={prototype._id}
            key={`${prototype._id}_name`}
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
