import { useState } from 'react'
import MissionMap from 'src/components/content/session/mission-map/MissionMap'
import CreateEffect from 'src/components/content/session/mission-map/ui/overlay/modals/CreateEffect'
import { TTabBarTab } from 'src/components/content/session/mission-map/ui/tabs/TabBar'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import { TSvgPanelElement_Input } from 'src/components/content/user-controls/buttons/panels/types'
import { useGlobalContext } from 'src/context/global'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import PrototypeTranslation from 'src/missions/transformations/translations'
import { compute } from 'src/toolbox'
import { useEventListener, useRequireLogin } from 'src/toolbox/hooks'
import { useMissionPageContext } from '../context'
import useForceItemButtonCallbacks from '../hooks/mission-components/forces'
import usePrototypeItemButtonCallbacks from '../hooks/mission-components/prototypes'
import MissionPage from '../MissionPage'

/**
 * Implementation of {@link MissionMap} for the {@link MissionPage}.
 */
export default function MissionPageMap(): TReactElement {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { notify } = globalContext.actions
  const {
    state: missionPageState,
    onChange,
    viewMode,
  } = useMissionPageContext()
  const [mission] = missionPageState.mission
  const [selection, setSelection] = missionPageState.selection
  const [effectModalActive, setEffectModalActive] =
    missionPageState.effectModalActive
  const [effectModalArgs] = missionPageState.effectModalArgs
  const {
    onDuplicateRequest: onDuplicateForceRequest,
    onDeleteRequest: onDeleteForceRequest,
  } = useForceItemButtonCallbacks()
  const {
    onAddRequest: onPrototypeAddRequest,
    onDeleteRequest: onPrototypeDeleteRequest,
  } = usePrototypeItemButtonCallbacks()
  const { isAuthorized } = useRequireLogin()
  const selectedForceState = useState<ClientMissionForce | null>(null)
  const nodeSvgEngine = useButtonSvgEngine({})
  const prototypeSvgEngine = useButtonSvgEngine({})

  /* -- COMPUTED -- */

  /**
   * Whether the add button for the tab bar
   * is enabled (Enables/Disables force creation).
   */
  const tabAddEnabled: boolean = compute(
    () =>
      mission.forces.length < ClientMission.MAX_FORCE_COUNT &&
      isAuthorized('missions_write'),
  )

  /**
   * Tabs for the mission map's tab bar.
   */
  const mapTabs: TTabBarTab[] = compute(() => {
    return mission.forces.map((force) => {
      const buttons: TSvgPanelElement_Input[] = [
        {
          key: 'copy',
          type: 'button',
          icon: 'copy',
          label: 'Duplicate',
          permissions: ['missions_write'],
          onClick: () => onDuplicateForceRequest(force),
        },
        {
          key: 'remove',
          type: 'button',
          icon: 'remove',
          label: 'Delete',
          permissions: ['missions_write'],
          onClick: () => onDeleteForceRequest(force),
        },
      ]

      const tabDescription = compute<string>(() => {
        if (viewMode === 'preview') return 'Select force'
        return `Select force` + `\n\t\n\`R-Click\` for more options`
      })

      const tab: TTabBarTab = {
        _id: force._id,
        text: force.name,
        color: force.color,
        description: tabDescription,
        engineProps: { elements: buttons },
      }

      return tab
    })
  })

  /* -- FUNCTIONS -- */

  /**
   * Ensures that at least one action exists for the selected node
   * if it is an executable node.
   */
  const ensureOneActionExistsIfExecutable = (): void => {
    if (
      selection instanceof ClientMissionNode &&
      selection.executable &&
      selection.actions.size === 0
    ) {
      // Checks to make sure the selected node has at least
      // one action to choose from. If the selected node doesn't
      // have at least one action then it will auto-generate one
      // for that node.
      let newAction = ClientMissionAction.create(selection)
      selection.actions.set(newAction._id, newAction)

      notify(
        `Auto-generated an action for ${selection.name} because it is an executable node with no actions to execute.`,
      )

      onChange(newAction)
    }
  }

  /**
   * Callback for when a request to add a new tab
   * (force) is made.
   */
  const onTabAdd = () => {
    let force = mission.createForce()
    onChange(force)
  }

  /**
   * Callback for when a prototype is selected.
   * @param prototype The selected prototype.
   */
  const onPrototypeSelect = (prototype: ClientMissionPrototype) => {
    if (prototype !== selection) {
      // If the transformation is a translation, set
      // the destination to the prototype.
      if (mission.transformation instanceof PrototypeTranslation) {
        mission.transformation.destination = prototype
        mission.handleStructureChange()
      }
      // Else, select the prototype in the mission.
      else {
        mission.select(prototype)
      }
    }
  }

  /**
   * Callback for when a node is selected.
   * @param node The selected node.
   */
  const onNodeSelect = (node: ClientMissionNode) => {
    if (node !== selection) {
      // Select the node.
      mission.select(node)
      // Create an action, if necessary.
      ensureOneActionExistsIfExecutable()
    }
  }

  /* -- EFFECTS -- */

  // Add event listener to watch for node selection
  // changes, updating the state accordingly.
  useEventListener(
    mission,
    ['selection', 'set-transformation'],
    () => {
      // Get previous and next selections.
      let prevSelection = selection
      let nextSelection = mission.selection
      let prevNode: ClientMissionNode | null =
        ClientMission.getNodeFromSelection(prevSelection)
      let nextNode: ClientMissionNode | null =
        ClientMission.getNodeFromSelection(nextSelection)

      // If there is a previous node, clear its buttons.
      if (prevNode) {
        nodeSvgEngine.removeAll()
        prevNode.buttons = nodeSvgEngine.buttons
      }

      // If there is a next node, then add the buttons.
      if (nextNode) {
        nodeSvgEngine.add(
          {
            key: 'cancel',
            type: 'button',
            icon: 'cancel',
            description: 'Deselect this node (Closes panel view also).',
            onClick: () => mission.select(nextNode!.force),
          },
          {
            key: 'divider',
            type: 'button',
            icon: 'divider',
            description:
              'Exclude this node from the force (Closes panel view also).',
            permissions: ['missions_write'],
            onClick: () => {
              nextNode!.exclude = true
              mission.select(nextNode!.force)
            },
          },
        )

        nextNode.buttons = nodeSvgEngine.buttons
      }

      // If there is a previous prototype, clear its buttons.
      if (prevSelection instanceof ClientMissionPrototype) {
        prototypeSvgEngine.removeAll()
        prevSelection.buttons = prototypeSvgEngine.buttons
      }

      // If there is a next prototype, then add the buttons.
      if (nextSelection instanceof ClientMissionPrototype) {
        if (mission.transformation) {
          prototypeSvgEngine.add({
            key: 'cancel',
            type: 'button',
            icon: 'cancel',
            description: 'Cancel action.',
            permissions: ['missions_write'],
            onClick: () => (mission.transformation = null),
          })
        } else {
          prototypeSvgEngine.add(
            {
              key: 'cancel',
              type: 'button',
              icon: 'cancel',
              description: 'Deselect this prototype (Closes panel view also).',
              onClick: () => mission.deselect(),
            },
            {
              key: 'add',
              type: 'button',
              icon: 'add',
              description: 'Create an adjacent prototype on the map.',
              permissions: ['missions_write'],
              onClick: () =>
                onPrototypeAddRequest(nextSelection as ClientMissionPrototype),
            },
            // todo: Reimplement this once node structure panel
            // todo: is removed.
            // {
            //   type: 'button',
            //   icon: 'reorder',
            //   description: 'Move this prototype to another location.',
            //   permissions: ['missions_write'],
            //   onClick: () => onPrototypeMoveRequest(nextSelection),
            // },
            {
              key: 'remove',
              type: 'button',
              icon: 'remove',
              description: 'Delete this prototype.',
              permissions: ['missions_write'],
              disabled: mission.prototypes.length < 2,
              onClick: () =>
                onPrototypeDeleteRequest(
                  nextSelection as ClientMissionPrototype,
                ),
            },
          )
        }

        nextSelection.buttons = prototypeSvgEngine.buttons
      }

      // Update the selection state.
      setSelection(mission.selection)
    },
    [selection],
  )

  /* -- RENDER -- */

  /**
   * Computed JSX for the mission map modal.
   */
  const modalJsx = compute((): TReactElement | null => {
    // If the selection is an action and the user has
    // requested to create a new effect, then display
    // the create effect modal.
    if (effectModalActive) {
      return (
        <CreateEffect
          host={effectModalArgs.host}
          trigger={effectModalArgs.trigger}
          onCloseRequest={() => setEffectModalActive(false)}
          onChange={onChange}
        />
      )
    }
    // Otherwise, return null.
    else {
      return null
    }
  })

  return (
    <MissionMap
      mission={mission}
      tabs={mapTabs}
      tabAddEnabled={tabAddEnabled}
      onTabAdd={onTabAdd}
      onPrototypeSelect={onPrototypeSelect}
      onNodeSelect={onNodeSelect}
      overlayContent={modalJsx}
      selectedForce={selectedForceState}
    />
  )
}
