import { useState } from 'react'
import { useBeforeunload } from 'react-beforeunload'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionNode, { ENodeDeleteMethod } from 'src/missions/nodes'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import { SingleTypeObject, TWithKey } from '../../../../shared/toolbox/objects'
import ActionEntry from '../content/edit-mission/ActionEntry'
import MissionEntry from '../content/edit-mission/MissionEntry'
import NodeEntry from '../content/edit-mission/NodeEntry'
import NodeStructuring from '../content/edit-mission/NodeStructuring'
import EffectEntry from '../content/edit-mission/target-effects/EffectEntry'
import {
  HomeLink,
  LogoutLink,
  TNavigation,
} from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import MissionMap from '../content/session/mission-map'
import { TNodeButton } from '../content/session/mission-map/objects/MissionNode'
import CreateEffectModal from '../content/session/mission-map/ui/overlay/modals/CreateEffectModal'
import { TButtonSvg } from '../content/user-controls/ButtonSvg'
import './MissionPage.scss'

/**
 * This will render page that allows the user to
 * edit a mission.
 */
export default function MissionPage({
  missionId,
}: IMissionPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { beginLoading, finishLoading, handleError, notify, prompt } =
    globalContext.actions

  /* -- STATE -- */

  const [mission, setMission] = useState<ClientMission>(new ClientMission())
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(
    missionId === null ? true : false,
  )
  const [selectedNode, setSelectedNode] = useState<ClientMissionNode | null>(
    null,
  )
  const [selectedAction, setSelectedAction] =
    useState<ClientMissionAction | null>(null)
  const [selectedEffect, setSelectedEffect] = useState<ClientEffect | null>(
    null,
  )
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)
  const [targetEnvironments, setTargetEnvironments] = useState<
    ClientTargetEnvironment[]
  >([])

  /* -- COMPUTED -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext), LogoutLink(globalContext)],
      boxShadow: 'alt-6',
    }),
  )

  /**
   * Determines whether or not to show the mission details.
   */
  const missionDetailsIsActive: boolean = compute(
    () => selectedNode === null && !nodeStructuringIsActive,
  )
  /**
   * Default size of the output panel.
   */
  const panel2DefaultSize: number = compute(() => {
    let panel2DefaultSize: number = 330 /*px*/
    let currentAspectRatio: number = window.innerWidth / window.innerHeight

    // If the aspect ratio is greater than or equal to 16:9,
    // and the window width is greater than or equal to 1850px,
    // then the default size of the output panel will be 40%
    // of the width of the window.
    if (currentAspectRatio >= 16 / 9 && window.innerWidth >= 1850) {
      panel2DefaultSize = window.innerWidth * 0.4
    }

    return panel2DefaultSize
  })
  /**
   * Boolean to determine if the effect is new.
   */
  const isNewEffect: boolean | null = compute(
    () =>
      selectedEffect && !selectedEffect.action.effects.includes(selectedEffect),
  )

  /* -- EFFECTS -- */

  const [mountHandled] = useMountHandler(async (done) => {
    // Handle the editing of an existing mission.
    if (missionId !== null) {
      try {
        beginLoading('Loading mission...')
        let mission: ClientMission = await ClientMission.$fetchOne(missionId, {
          openAll: true,
        })
        setMission(mission)
      } catch {
        handleError('Failed to load mission.')
      }
    }

    // Load the target environments.
    try {
      beginLoading('Loading target environments...')
      setTargetEnvironments(await ClientTargetEnvironment.$fetchAll())
    } catch {
      handleError('Failed to load target environments.')
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  // Guards against refreshing or navigating away
  // with unsaved changes.
  useBeforeunload((event) => {
    if (areUnsavedChanges) {
      event.preventDefault()
    }
  })

  // Navigation middleware to protect from navigating
  // away with unsaved changes.
  useNavigationMiddleware(
    async (to, next) => {
      // If there are unsaved changes, prompt the user.
      if (areUnsavedChanges) {
        const { choice } = await prompt(
          'You have unsaved changes. What do you want to do with them?',
          ['Cancel', 'Save', 'Discard'],
        )

        try {
          // Abort if cancelled.
          if (choice === 'Cancel') {
            return
          }
          // Save if requested.
          else if (choice === 'Save') {
            beginLoading('Saving...')
            await save()
            finishLoading()
          }
        } catch (error) {
          return handleError({
            message: 'Failed to save mission.',
            notifyMethod: 'bubble',
          })
        }
      }

      // Call next.
      next()
    },
    [areUnsavedChanges],
  )

  // Add event listener to watch for node selection
  // changes, updating the state accordingly.
  useEventListener(
    mission,
    ['node-selection', 'structure-change'],
    () => {
      // Get previous and next selections.
      let prevSelection: ClientMissionNode | null = selectedNode
      let nextSelection: ClientMissionNode | null = mission.selectedNode

      // Clear previous buttons.
      if (prevSelection) {
        prevSelection.buttons = []
      }

      // If the next selection is a node, then add the buttons.
      if (nextSelection) {
        // Define potential buttons.
        const availableNodeButtons: SingleTypeObject<TNodeButton> = {
          deselect: {
            icon: 'cancel',
            key: 'node-button-deselect',
            tooltipDescription: 'Deselect this node (Closes panel view also).',
            onClick: () => mission.deselectNode(),
          },
          add: {
            icon: 'add',
            key: 'node-button-add',
            tooltipDescription: 'Create an adjacent node on the map.',
            onClick: () => {
              mission.creationMode = true
            },
          },
          add_cancel: {
            icon: 'cancel',
            key: 'node-button-add-cancel',
            tooltipDescription: 'Cancel node creation.',
            onClick: () => (mission.creationMode = false),
          },
          // todo: Fix this to work with prototypes.
          remove: {
            icon: 'remove',
            key: 'node-button-remove',
            tooltipDescription: 'Delete this node.',
            disabled: mission.prototypes.length < 2,
            onClick: (_, node) => {
              handleNodeDeleteRequest(node)
            },
          },
        }

        // Define the buttons that will actually be used.
        const activeNodeButtons = []

        // If not in creation mode, then add deselect, add, and
        // remove buttons.
        if (!mission.creationMode) {
          activeNodeButtons.push(
            availableNodeButtons.deselect,
            // todo: These should be used in prototypes.
            // availableNodeButtons.add,
            // availableNodeButtons.remove,
          )
        }
        // Else, add a cancel button for adding a node.
        else {
          activeNodeButtons.push(availableNodeButtons.add_cancel)
        }

        // Set the buttons on the next selection.
        nextSelection.buttons = activeNodeButtons
      }

      // Update state.
      setSelectedNode(nextSelection)
      activateNodeStructuring(false)
      setSelectedAction(null)
      setSelectedEffect(null)
    },
    [selectedNode],
  )

  // Add event listener to watch for when a new
  // node is spawned in the mission.
  useEventListener(mission, 'spawn-node', () => {
    // Mark unsaved changes as true.
    setAreUnsavedChanges(true)
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles when a change is made that would require saving.
   */
  const handleChange = (): void => {
    setAreUnsavedChanges(true)
  }

  /**
   * Saves the mission to the server with
   * any changes made.
   * @returns A promise that resolves when the mission has been saved.
   */
  const save = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (areUnsavedChanges) {
          // Set unsaved changes to false to
          // prevent multiple saves.
          setAreUnsavedChanges(false)
          // Save the mission and notify
          // the user.
          await mission.saveToServer()
          notify('Mission successfully saved.')
        }
        resolve()
      } catch (error) {
        // Notify and revert upon error.
        notify('Mission failed to save')
        setAreUnsavedChanges(true)
        reject(error)
      }
    })
  }

  // todo: Fix this to work with prototypes.
  /**
   * Ensures that at least one node exists in the mission.
   * @note If a node is deleted and there are no remaining nodes,
   * then a new node is auto-generated and the user is notified.
   */
  const ensureOneNodeExists = (): void => {
    // if (
    //   mission.prototypes.length === 1 &&
    //   mission.lastCreatedNode?._id === Array.from(mission.nodes.values())[0]._id
    // ) {
    //   notify(
    //     'Auto-generated a node for this mission, since missions must have at least one node.',
    //   )
    // }
  }

  /**
   * Ensures that at least one action exists for the selected node
   * if it is an executable node.
   */
  const ensureOneActionExistsIfExecutable = (): void => {
    if (
      selectedNode !== null &&
      selectedNode.executable &&
      selectedNode.actions.size === 0
    ) {
      // Checks to make sure the selected node has at least
      // one action to choose from. If the selected node doesn't
      // have at least one action then it will auto-generate one
      // for that node.
      let newAction: ClientMissionAction = new ClientMissionAction(selectedNode)
      selectedNode.actions.set(newAction._id, newAction)

      notify(
        `Auto-generated an action for ${selectedNode.name} because it is an executable node with no actions to execute.`,
      )

      handleChange()
    }
  }

  /**
   * Handler for when a node is selected.
   * @param node The selected node.
   */
  let onNodeSelect = (node: ClientMissionNode) => {
    if (node !== selectedNode) {
      // Select the node.
      mission.selectNode(node)
      // Create an action, if necessary.
      ensureOneActionExistsIfExecutable()
    }
  }

  /**
   * Handler for when the user requests to delete a node.
   * @param node The node to be deleted.
   */
  const handleNodeDeleteRequest = async (
    node: ClientMissionNode,
  ): Promise<void> => {
    // Gather details.
    let deleteMethod: ENodeDeleteMethod =
      ENodeDeleteMethod.DeleteNodeAndChildren
    let message: string
    let choices: ['Cancel', 'Node', 'Node + Children', 'Confirm'] = [
      'Cancel',
      'Node',
      'Node + Children',
      'Confirm',
    ]

    // Set the message and choices based on the node's children.
    if (node.hasChildren) {
      message = `Please confirm if you would like to delete "${node.name}" only or "${node.name}" and all of it's children.`
      choices.pop()
    } else {
      message = `Please confirm the deletion of "${node.name}".`
      choices.splice(1, 2)
    }

    // Prompt the user for confirmation.
    let { choice } = await prompt(message, choices)

    // If the user selects node only, update the delete method.
    if (choice === 'Node') {
      deleteMethod = ENodeDeleteMethod.DeleteNodeAndShiftChildren
    }
    // Return if the user cancels the deletion.
    else if (choice === 'Cancel') {
      return
    }

    // Delete the node.
    node.delete({
      deleteMethod,
    })
    // Handle the change.
    handleChange()
    activateNodeStructuring(false)
    mission.deselectNode()
    ensureOneNodeExists()
  }

  /**
   * Handler for when the user requests to add a new node.
   */
  const handleNodeAddRequest = (): void => {
    mission.creationMode = true
  }

  /* -- PRE-RENDER PROCESSING -- */

  // Create the custom form-related buttons for the map.
  const mapCustomButtons: TWithKey<TButtonSvg>[] = [
    {
      icon: 'reorder',
      key: 'reorder',
      onClick: () => {
        mission.deselectNode()
        activateNodeStructuring(true)
      },
      tooltipDescription: 'Edit the structure and order of nodes.',
      disabled: nodeStructuringIsActive,
    },
    {
      icon: 'save',
      key: 'save',
      onClick: save,
      tooltipDescription: 'Save changes.',
      disabled: !areUnsavedChanges,
    },
  ]

  /**
   * Computed JSX for the mission map modal.
   */
  const modalJsx = compute((): JSX.Element | null => {
    // If the selected effect is new and there are target environments
    // to choose from, then display the create effect modal.
    if (selectedEffect && isNewEffect && targetEnvironments.length > 0) {
      return (
        <CreateEffectModal
          effect={selectedEffect}
          targetEnvironments={targetEnvironments}
          handleClose={() => setSelectedEffect(null)}
          handleChange={handleChange}
        />
      )
    } else {
      return null
    }
  })

  /**
   * Renders JSX for panel 2 of the resize relationship.
   */
  const renderPanel2 = (): JSX.Element | null => {
    if (missionDetailsIsActive) {
      return (
        <MissionEntry
          active={missionDetailsIsActive}
          mission={mission}
          handleChange={handleChange}
          key={mission._id}
        />
      )
    } else if (selectedNode && !selectedAction && !selectedEffect) {
      return (
        <NodeEntry
          node={selectedNode}
          setSelectedAction={setSelectedAction}
          handleChange={handleChange}
          handleAddRequest={handleNodeAddRequest}
          handleDeleteRequest={() => handleNodeDeleteRequest(selectedNode)}
          key={selectedNode._id}
        />
      )
    } else if (
      selectedNode &&
      selectedAction &&
      (!selectedEffect || isNewEffect)
    ) {
      return (
        <ActionEntry
          action={selectedAction}
          targetEnvironments={targetEnvironments}
          setSelectedAction={setSelectedAction}
          setSelectedEffect={setSelectedEffect}
          handleChange={handleChange}
          key={selectedAction._id}
        />
      )
    } else if (
      selectedNode &&
      selectedAction &&
      selectedEffect &&
      !isNewEffect
    ) {
      return (
        <EffectEntry
          effect={selectedEffect}
          setSelectedAction={setSelectedAction}
          setSelectedEffect={setSelectedEffect}
          handleChange={handleChange}
          key={selectedEffect._id}
        />
      )
    } else if (nodeStructuringIsActive) {
      return (
        <NodeStructuring
          active={nodeStructuringIsActive}
          mission={mission}
          handleChange={handleChange}
          handleCloseRequest={() => activateNodeStructuring(false)}
        />
      )
    } else {
      return null
    }
  }

  /* -- RENDER -- */

  if (mountHandled) {
    return (
      <div className={'MissionPage Page'}>
        <DefaultLayout navigation={navigation}>
          <PanelSizeRelationship
            panel1={{
              ...ResizablePanel.defaultProps,
              minSize: 330,
              render: () => (
                <MissionMap
                  mission={mission}
                  customButtons={mapCustomButtons}
                  onNodeSelect={onNodeSelect}
                  overlayContent={modalJsx}
                />
              ),
            }}
            panel2={{
              ...ResizablePanel.defaultProps,
              minSize: 330,
              render: renderPanel2,
            }}
            sizingMode={EPanelSizingMode.Panel1_Auto__Panel2_Defined}
            initialDefinedSize={panel2DefaultSize}
          />
        </DefaultLayout>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR MISSION PAGE ---------------------------- */

export interface IMissionPage extends TPage_P {
  /**
   * The ID of the mission to be edited. If null,
   * a new mission is being created.
   */
  missionId: string | null
}
