import { useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionForce from 'src/missions/forces'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import Prompt from '../../communication/Prompt'
import { DetailString } from '../../form/DetailString'
import { ButtonText } from '../../user-controls/ButtonText'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of a mission force.
 */
export default function ForceEntry({
  force,
  force: { mission },
  handleChange,
}: TForceEntry): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate, prompt } = useGlobalContext().actions

  /* -- STATE -- */
  const [name, setName] = useState<string>(force.name)

  /* -- COMPUTED -- */

  /**
   * The class name for the delete node button.
   */
  const deleteClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []
    // If the mission has only one force, add the disabled class.
    if (mission.forces.length < 2) {
      classList.push('Disabled')
    }
    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // Sync the component state with the force name.
  usePostInitEffect(() => {
    // Update the force name.
    force.name = name
    // Allow the user to save the changes.
    handleChange()
  }, [name])

  // This displays the change in the mission path found at
  // the top of the side panel.
  useEffect(() => forceUpdate(), [name])

  /* -- FUNCTIONS -- */

  /**
   * Handles the request to delete a force.
   */
  const onDelete = async () => {
    // Prompt the user to confirm the deletion.
    let { choice } = await prompt(
      `Please confirm the deletion of this force.`,
      Prompt.ConfirmationChoices,
    )
    // If the user cancels, abort.
    if (choice === 'Cancel') return
    // Filter out the force.
    mission.forces = mission.forces.filter(({ _id }) => _id !== force._id)
    // Update the mission structure.
    mission.handleStructureChange()
    // Navigate back to the mission.
    mission.selectBack()
    // Allow the user to save the changes.
    handleChange()
  }

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
            stateValue={name}
            setState={setName}
            defaultValue={ClientMissionForce.DEFAULT_PROPERTIES.name}
            maxLength={ClientMissionForce.MAX_NAME_LENGTH}
            key={`${force._id}_name`}
          />

          <div className='ButtonContainer'>
            <ButtonText
              text='Delete force'
              onClick={onDelete}
              tooltipDescription='Delete this force.'
              uniqueClassName={deleteClassName}
            />
          </div>
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
