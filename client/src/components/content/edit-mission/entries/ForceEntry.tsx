import { useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionForce from 'src/missions/forces'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import Mission from '../../../../../../shared/missions'
import { DetailColorSelector } from '../../form/DetailColorSelector'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import {
  ButtonText,
  TButtonText_P,
} from '../../user-controls/buttons/ButtonText'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of a mission force.
 */
export default function ForceEntry({
  force,
  force: { mission },
  duplicateForce,
  deleteForce,
  handleChange,
}: TForceEntry): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate, prompt, notify } = useGlobalContext().actions

  /* -- STATE -- */
  const [introMessage, setIntroMessage] = useState<string>(force.introMessage)
  const [name, setName] = useState<string>(force.name)
  const [color, setColor] = useState<string>(force.color)
  const [initialResources, setInitialResources] = useState<number>(
    force.initialResources,
  )

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

  /**
   * The list of buttons for the node's border color.
   */
  const colorButtons: TButtonText_P[] = compute(() => {
    // Create a default list of buttons.
    let buttons: TButtonText_P[] = []

    // Create a button that will fill all nodes
    // in the force with the selected color.
    let fillButton: TButtonText_P = {
      text: 'Apply to Nodes',
      onClick: async () => {
        force.nodes.forEach((node) => {
          node.color = color
        })
        handleChange()
        forceUpdate()
      },
      tooltipDescription: `Applies the selected color to all nodes in the force.`,
    }

    // Add the fill button to the list of buttons.
    buttons.push(fillButton)

    // Return the buttons.
    return buttons
  })

  /* -- EFFECTS -- */

  // Sync the component state with the force name.
  usePostInitEffect(() => {
    // Update the force properties.
    force.introMessage = introMessage
    force.name = name
    force.color = color
    force.initialResources = initialResources

    // Allow the user to save the changes.
    handleChange()
  }, [introMessage, name, color, initialResources])

  // This displays changes in the mission path
  // and the tab bar.
  useEffect(() => forceUpdate(), [name, color])

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
          <DetailColorSelector
            fieldType='required'
            label='Color'
            colors={ClientMission.COLOR_OPTIONS}
            isExpanded={false}
            stateValue={color}
            setState={setColor}
            buttons={colorButtons}
            key={`${force._id}_color`}
          />
          <DetailLargeString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Introduction Message'
            stateValue={introMessage}
            setState={setIntroMessage}
            defaultValue={ClientMissionForce.DEFAULT_PROPERTIES.introMessage}
            elementBoundary='.SidePanelSection'
            key={`${force._id}_introMessage`}
          />
          <DetailNumber
            fieldType='required'
            label='Initial Resources'
            stateValue={initialResources}
            setState={setInitialResources}
            integersOnly={true}
            key={`${force._id}_initialResources`}
          />
          <div className='ButtonContainer'>
            <ButtonText
              text='Duplicate force'
              onClick={duplicateForce}
              tooltipDescription='Duplicate this force.'
              disabled={
                mission.forces.length >= Mission.MAX_FORCE_COUNT
                  ? 'full'
                  : 'none'
              }
            />
            <ButtonText
              text='Delete force'
              onClick={deleteForce}
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
   * A function that will be used to duplicate the force.
   */
  duplicateForce: () => void
  /**
   * A function that will be used to delete the force.
   */
  deleteForce: () => void
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}
