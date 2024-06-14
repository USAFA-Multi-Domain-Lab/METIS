import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { DetailString } from '../../form/DetailString'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of a mission prototype.
 */
export default function PrototypeEntry({
  prototype,
  handleChange,
}: TPrototypeEntry): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  /* -- STATE -- */

  /* -- COMPUTED -- */

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
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='ID'
            stateValue={prototype._id}
            setState={() => {}}
            defaultValue={prototype._id}
            key={`${prototype._id}_name`}
          />
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
}
