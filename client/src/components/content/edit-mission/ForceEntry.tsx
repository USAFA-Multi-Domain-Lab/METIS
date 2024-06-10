import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionForce from 'src/missions/forces'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { DetailString } from '../form/Form'
import './MissionEntry.scss'

/**
 * This will render the basic editable details of a mission force.
 */
export default function ForceEntry({
  active,
  force,
  handleChange,
}: TForceEntry): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [forceName, setForceName] = useState<string>(force.name)

  /* -- COMPUTED -- */
  /**
   * The current location within the force.
   */
  const forcePath: string[] = compute(() => [forceName])

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

  /**
   * Renders JSX for the back button.
   */
  const renderBackButtonJsx = (): JSX.Element | null => {
    return (
      <div className='BackContainer'>
        <div className='BackButton Disabled'>&lt;</div>
      </div>
    )
  }
  /**
   * Renders JSX for the path of the force.
   */
  const renderPathJsx = (): JSX.Element | null => {
    return (
      <div className='Path'>
        Location:{' '}
        {forcePath.map((position: string, index: number) => {
          return (
            <span className='Position' key={`position-${index}`}>
              <span className='PositionText'>{position}</span>{' '}
              {index === forcePath.length - 1 ? '' : ' > '}
            </span>
          )
        })}
      </div>
    )
  }

  /* -- RENDER -- */

  if (active) {
    return (
      <div className='ForceEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className='BoxTop'>
            <div className='ErrorMessage Hidden'></div>
            {renderBackButtonJsx()}
            {renderPathJsx()}
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
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR FORCE ENTRY ---------------------------- */

export type TForceEntry = {
  /**
   * Whether or not this component is active.
   */
  active: boolean
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
