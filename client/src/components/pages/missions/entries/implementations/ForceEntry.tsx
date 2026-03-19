import Prompt from '@client/components/content/communication/Prompt'
import { DetailLargeString } from '@client/components/content/form/DetailLargeString'
import { DetailString } from '@client/components/content/form/DetailString'
import { DetailToggle } from '@client/components/content/form/DetailToggle'
import Divider from '@client/components/content/form/Divider'
import { DetailColorSelector } from '@client/components/content/form/dropdowns/colors/DetailColorSelector'
import type { TButtonText_P } from '@client/components/content/user-controls/buttons/ButtonText'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import Entry from '@client/components/pages/missions/entries/Entry'
import ResourcePoolSubentry from '@client/components/pages/missions/entries/implementations/ResourcePoolSubentry'
import useForceItemButtonCallbacks from '@client/components/pages/missions/hooks/mission-components/forces'
import { useGlobalContext } from '@client/context/global'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks'
import { Mission } from '@shared/missions/Mission'
import type { TNonEmptyArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { Fragment, useState } from 'react'
import EntryHeader from '../EntryHeader'

/**
 * This will render the basic editable details of a mission force.
 */
export default function ForceEntry({
  force,
  force: { mission },
}: TForceEntry): TReactElement | null {
  /* -- STATE -- */

  const { prompt } = useGlobalContext().actions
  const { onChange, viewMode } = useMissionPageContext()
  const { onDuplicateRequest, onDeleteRequest } = useForceItemButtonCallbacks()
  const [introMessage, setIntroMessage] = useState<string>(force.introMessage)
  const [name, setName] = useState<string>(force.name)
  const [color, setColor] = useState<string>(force.color)
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
      disabled: viewMode === 'preview' ? 'full' : 'none',
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
    force.introMessage = introMessage
    force.name = name
    force.color = color
    force.revealAllNodes = revealAllNodes
    onChange(force)
  }, [introMessage, name, color, revealAllNodes])

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
        disabled={viewMode === 'preview'}
        key={`${force._id}_name`}
      />
      <DetailToggle
        label='Reveal All Nodes'
        value={revealAllNodes}
        setValue={setRevealAllNodes}
        tooltipDescription='If enabled, all nodes in the force will be revealed to the player at the start of the session.'
        disabled={viewMode === 'preview'}
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
        disabled={viewMode === 'preview'}
        key={`${force._id}_color`}
      />
      <DetailLargeString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Introduction Message'
        value={introMessage}
        setValue={setIntroMessage}
        defaultValue={ClientMissionForce.DEFAULT_PROPERTIES.introMessage}
        disabled={viewMode === 'preview'}
        key={`${force._id}_introMessage`}
      />
      <Divider />
      <EntryHeader heading='Resource Pools' />
      {force.resourcePools.map((pool) => (
        <Fragment key={`${force._id}_pool_${pool._id}`}>
          <ResourcePoolSubentry pool={pool} />
          <Divider />
        </Fragment>
      ))}
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
