import Prompt from 'metis/client/components/content/communication/Prompt'
import { DetailColorSelector } from 'metis/client/components/content/form/DetailColorSelector'
import { DetailLargeString } from 'metis/client/components/content/form/DetailLargeString'
import { DetailNumber } from 'metis/client/components/content/form/DetailNumber'
import { DetailString } from 'metis/client/components/content/form/DetailString'
import { DetailToggle } from 'metis/client/components/content/form/DetailToggle'
import { TButtonText_P } from 'metis/client/components/content/user-controls/buttons/ButtonText'
import { useButtonSvgEngine } from 'metis/client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from 'metis/client/components/pages/missions/context'
import Entry from 'metis/client/components/pages/missions/entries/Entry'
import useForceItemButtonCallbacks from 'metis/client/components/pages/missions/hooks/mission-components/forces'
import { useGlobalContext } from 'metis/client/context/global'
import ClientMission from 'metis/client/missions'
import ClientMissionForce from 'metis/client/missions/forces'
import ClientMissionNode from 'metis/client/missions/nodes'
import { compute } from 'metis/client/toolbox'
import { usePostInitEffect } from 'metis/client/toolbox/hooks'
import { Mission } from 'metis/missions'
import { TNonEmptyArray } from 'metis/toolbox/ArrayToolbox'
import { useState } from 'react'

/**
 * This will render the basic editable details of a mission force.
 */
export default function ForceEntry({
  force,
  force: { mission },
}: TForceEntry): TReactElement | null {
  /* -- STATE -- */

  const { prompt } = useGlobalContext().actions
  const { onChange } = useMissionPageContext()
  const { onDuplicateRequest, onDeleteRequest } = useForceItemButtonCallbacks()
  const [introMessage, setIntroMessage] = useState<string>(force.introMessage)
  const [name, setName] = useState<string>(force.name)
  const [color, setColor] = useState<string>(force.color)
  const [initialResources, setInitialResources] = useState<number>(
    force.initialResources,
  )
  const [allowNegativeResources, setAllowNegativeResources] = useState<boolean>(
    force.allowNegativeResources,
  )
  const [revealAllNodes, setRevealAllNodes] = useState<
    ClientMissionForce['revealAllNodes']
  >(force.revealAllNodes)
  const svgEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'copy',
        type: 'button',
        icon: 'copy',
        description: 'Duplicate force',
        disabled: mission.forces.length >= Mission.MAX_FORCE_COUNT,
        permissions: ['missions_write'],
        onClick: () => onDuplicateRequest(force),
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete force',
        disabled: mission.forces.length < 2,
        permissions: ['missions_write'],
        onClick: () => onDeleteRequest(force),
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * The list of buttons for the node's border color.
   */
  const colorButtons: TButtonText_P[] = compute(() => {
    // Create a default list of buttons.
    let buttons: TButtonText_P[] = []

    // Create a button that will fill all nodes
    // in the force with the selected color.
    let fillButton: TButtonText_P = {
      text: 'Apply to nodes',
      onClick: async () => {
        // Prompt the user to confirm the action.
        let { choice } = await prompt(
          `Are you sure you want to apply the color to all nodes in the force?`,
          Prompt.ConfirmationChoices,
        )

        // If the user cancels, abort.
        if (choice === 'Cancel') return

        force.nodes.forEach((node) => {
          node.color = color
          node.emitEvent('set-color')
        })
        if (force.nodes.length) {
          onChange(...(force.nodes as TNonEmptyArray<ClientMissionNode>))
        }
      },
      tooltipDescription: `Applies the selected color to all nodes in the force.`,
    }

    // Add the fill button to the list of buttons.
    buttons.push(fillButton)

    // Return the buttons.
    return buttons
  })

  /* -- EFFECTS -- */

  usePostInitEffect(() => {
    // Update the force properties.
    force.introMessage = introMessage
    force.name = name
    force.color = color
    force.initialResources = initialResources
    force.allowNegativeResources = allowNegativeResources
    force.revealAllNodes = revealAllNodes

    // Allow the user to save the changes.
    onChange(force)
  }, [
    introMessage,
    name,
    color,
    initialResources,
    allowNegativeResources,
    revealAllNodes,
  ])

  /* -- RENDER -- */

  return (
    <Entry missionComponent={force} svgEngines={[svgEngine]}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientMissionForce.DEFAULT_PROPERTIES.name}
        maxLength={ClientMissionForce.MAX_NAME_LENGTH}
        key={`${force._id}_name`}
      />
      <DetailNumber
        fieldType='required'
        label='Initial Resources'
        value={initialResources}
        setValue={setInitialResources}
        integersOnly={true}
        key={`${force._id}_initialResources`}
      />
      <DetailToggle
        label='Negative Resource Pool'
        value={allowNegativeResources}
        setValue={setAllowNegativeResources}
        tooltipDescription="If enabled, the force's resource pool can go below zero."
        key={`${force._id}_allowNegativeResources`}
      />
      <DetailToggle
        label='Reveal All Nodes'
        value={revealAllNodes}
        setValue={setRevealAllNodes}
        tooltipDescription='If enabled, all nodes in the force will be revealed to the player at the start of the session.'
        key={`${force._id}_revealAllNodes`}
      />
      <DetailColorSelector
        fieldType='required'
        label='Color'
        colors={ClientMission.COLOR_OPTIONS}
        isExpanded={false}
        value={color}
        setValue={setColor}
        buttons={colorButtons}
        key={`${force._id}_color`}
      />
      <DetailLargeString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Introduction Message'
        value={introMessage}
        setValue={setIntroMessage}
        defaultValue={ClientMissionForce.DEFAULT_PROPERTIES.introMessage}
        key={`${force._id}_introMessage`}
      />
    </Entry>
  )
}

/* ---------------------------- TYPES FOR FORCE ENTRY ---------------------------- */

export type TForceEntry = {
  /**
   * The force to be edited.
   */
  force: ClientMissionForce
}
