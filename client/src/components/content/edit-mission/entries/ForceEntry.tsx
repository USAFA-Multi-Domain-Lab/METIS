import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionForce from 'src/missions/forces'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { DetailString } from '../../form/DetailString'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of a mission force.
 */
export default function ForceEntry({
  force,
  handleChange,
}: TForceEntry): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [forceName, setForceName] = useState<string>(force.name)

  /* -- COMPUTED -- */

  /* -- EFFECTS -- */

  // Sync the component state with the force name.
  usePostInitEffect(() => {
    // Update the force name.
    force.name = forceName

    // This is to show the change to
    // the name of the force shown
    // on the mission map.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }, [forceName])

  /* -- FUNCTIONS -- */

  /* -- RENDER -- */

  return (
    <div className='Entry ForceEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={force} />
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelSection MainDetails'>
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Name'
            stateValue={forceName}
            setState={setForceName}
            defaultValue={ClientMissionForce.DEFAULT_PROPERTIES.name}
            key={`${force._id}_name`}
          />
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR FORCE ENTRY ---------------------------- */

export type TForceEntry = {
  /**
   * The force to be edited.
   */
  force: ClientMissionForce
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}
