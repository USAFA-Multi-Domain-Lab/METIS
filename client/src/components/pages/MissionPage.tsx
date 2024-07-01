import { useState } from 'react'
import { useBeforeunload } from 'react-beforeunload'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import ClientMission, { TMissionNavigable } from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import { ClientExternalEffect } from 'src/missions/effects/external'
import { ClientInternalEffect } from 'src/missions/effects/internal'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode, { ENodeDeleteMethod } from 'src/missions/nodes'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import PrototypeCreation from 'src/missions/transformations/creations'
import PrototypeTranslation from 'src/missions/transformations/translations'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import Mission from '../../../../shared/missions'
import { TWithKey } from '../../../../shared/toolbox/objects'
import ActionEntry from '../content/edit-mission/entries/ActionEntry'
import ExternalEffectEntry from '../content/edit-mission/entries/ExternalEffectEntry'
import ForceEntry from '../content/edit-mission/entries/ForceEntry'
import InternalEffectEntry from '../content/edit-mission/entries/InternalEffectEntry'
import MissionEntry from '../content/edit-mission/entries/MissionEntry'
import NodeEntry from '../content/edit-mission/entries/NodeEntry'
import NodeStructuring from '../content/edit-mission/entries/NodeStructuring'
import PrototypeEntry from '../content/edit-mission/entries/PrototypeEntry'
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
import { TPrototypeButton } from '../content/session/mission-map/objects/MissionPrototype'
import CreateExternalEffect from '../content/session/mission-map/ui/overlay/modals/CreateExternalEffect'
import CreateInternalEffect from '../content/session/mission-map/ui/overlay/modals/CreateInternalEffect'
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
  const [selection, setSelection] = useState<TMissionNavigable>(
    mission.selection,
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
   * Boolean to determine if the external effect is new.
   */
  const isNewExternalEffect: boolean = compute(
    () =>
      mission.selection instanceof ClientExternalEffect &&
      !mission.selection.action.externalEffects.includes(mission.selection),
  )

  /**
   * Boolean to determine if the internal effect is new.
   */
  const isNewInternalEffect: boolean = compute(
    () =>
      mission.selection instanceof ClientInternalEffect &&
      !mission.selection.action.internalEffects.includes(mission.selection),
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
    ['selection', 'set-transformation'],
    () => {
      // Get previous and next selections.
      let prevSelection: TMissionNavigable = selection
      let nextSelection: TMissionNavigable = mission.selection
      let prevNode: ClientMissionNode | null =
        ClientMission.getNodeFromSelection(prevSelection)
      let nextNode: ClientMissionNode | null =
        ClientMission.getNodeFromSelection(nextSelection)

      // If there is a previous node, clear its buttons.
      if (prevNode) {
        prevNode.buttons = []
      }

      // If there is a next node, then add the buttons.
      if (nextNode) {
        nextNode.buttons = [
          {
            icon: 'cancel',
            key: 'node-button-deselect',
            tooltipDescription: 'Deselect this node (Closes panel view also).',
            onClick: () => mission.select(nextNode!.force),
          },
        ]
      }

      // If there is a previous prototype, clear its buttons.
      if (prevSelection instanceof ClientMissionPrototype) {
        prevSelection.buttons = []
      }

      // If there is a next prototype, then add the buttons.
      if (nextSelection instanceof ClientMissionPrototype) {
        // Define potential buttons.
        const availableButtons = {
          deselect: {
            icon: 'cancel',
            key: 'prototype-button-deselect',
            tooltipDescription:
              'Deselect this prototype (Closes panel view also).',
            onClick: () => mission.deselect(),
          } as TPrototypeButton,
          add: {
            icon: 'add',
            key: 'prototype-button-add',
            tooltipDescription: 'Create an adjacent prototype on the map.',
            onClick: (_, prototype) => {
              handlePrototypeAddRequest(prototype)
            },
          } as TPrototypeButton,
          move: {
            icon: 'reorder',
            key: 'prototype-button-move',
            tooltipDescription: 'Move this prototype to another location.',
            onClick: (_, prototype) => {
              handlePrototypeMoveRequest(prototype)
            },
          } as TPrototypeButton,
          transform_cancel: {
            icon: 'cancel',
            key: 'prototype-button-add-cancel',
            tooltipDescription: 'Cancel action.',
            onClick: () => (mission.transformation = null),
          } as TPrototypeButton,
          remove: {
            icon: 'remove',
            key: 'prototype-button-remove',
            tooltipDescription: 'Delete this prototype.',
            disabled: mission.prototypes.length < 2,
            onClick: (_, prototype) => {
              // todo: Uncomment and make this work with prototypes.
              // handleNodeDeleteRequest(prototype)
            },
          } as TPrototypeButton,
        }

        // Define the buttons that will actually be used.
        const activeButtons = []

        // If there is a transformation being made within the mission,
        // then add a cancel button for the transformation.
        if (mission.transformation) {
          activeButtons.push(availableButtons.transform_cancel)
        }
        // Else, add default buttons for a selected prototype.
        else {
          activeButtons.push(availableButtons.deselect, availableButtons.add)

          // If there is at least two prototypes, then add
          // the remove and move buttons.
          if (mission.prototypes.length > 1) {
            // todo: Reimplement this once node structure panel
            // todo: is removed.
            // activeButtons.push(availableButtons.move)
            activeButtons.push(availableButtons.remove)
          }
        }

        // Set the buttons on the next selection.
        nextSelection.buttons = activeButtons
      }

      // Update the selection state.
      setSelection(mission.selection)
    },
    [selection],
  )

  // Add event listener to watch for when a new
  // node is spawned in the mission.
  useEventListener(mission, 'new-prototype', () => {
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
  const save = async () => {
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
    } catch (error) {
      // Notify and revert upon error.
      notify('Mission failed to save')
      setAreUnsavedChanges(true)
    }
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
      selection instanceof ClientMissionNode &&
      selection.executable &&
      selection.actions.size === 0
    ) {
      // Checks to make sure the selected node has at least
      // one action to choose from. If the selected node doesn't
      // have at least one action then it will auto-generate one
      // for that node.
      let newAction: ClientMissionAction = new ClientMissionAction(selection)
      selection.actions.set(newAction._id, newAction)

      notify(
        `Auto-generated an action for ${selection.name} because it is an executable node with no actions to execute.`,
      )

      handleChange()
    }
  }

  /**
   * Callback for when a request to add a new tab
   * (force) is made.
   */
  const onTabAdd = compute(() => {
    // If the mission has reached the maximum number
    // of forces, return null, disabling the add button.
    if (mission.forces.length >= Mission.MAX_FORCE_COUNT) return null

    // Return default callback.
    return () => {
      mission.createForce()
      handleChange()
    }
  })

  /**
   * Callback for when a prototype is selected.
   * @param prototype The selected prototype.
   */
  const onPrototypeSelect = (prototype: ClientMissionPrototype) => {
    if (prototype !== selection) {
      // Get the current transformation in the mission.
      let transformation = mission.transformation
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
    // todo: Remove this.
    // mission.deselectNode()
    ensureOneNodeExists()
  }

  /**
   * Handler for when the user requests to add a new prototype.
   */
  const handlePrototypeAddRequest = (
    prototype: ClientMissionPrototype,
  ): void => {
    mission.transformation = new PrototypeCreation(prototype)
  }

  /**
   * Handler for when the user requests to add a new prototype.
   */
  const handlePrototypeMoveRequest = (
    prototype: ClientMissionPrototype,
  ): void => {
    mission.transformation = new PrototypeTranslation(prototype)
  }

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * Custom buttons for the mission map.
   */
  const mapCustomButtons: TWithKey<TButtonSvg>[] = [
    {
      icon: 'reorder',
      key: 'reorder',
      onClick: () => {
        // todo: Resolve this.
        // mission.deselectNode()
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
    // If the selected external effect is new and there are
    // target environments to choose from, then display the
    // create external effect modal.
    if (isNewExternalEffect && targetEnvironments.length > 0) {
      return (
        <CreateExternalEffect
          // This is definitely an external effect, based
          // on the state of `isNewExternalEffect`.
          effect={mission.selection as ClientExternalEffect}
          targetEnvironments={targetEnvironments}
          handleChange={handleChange}
        />
      )
    }
    // Or, if the selected internal effect is new, then display the
    // create internal effect modal.
    else if (isNewInternalEffect) {
      return (
        <CreateInternalEffect
          // This is definitely an internal effect, based
          // on the state of `isNewInternalEffect`.
          effect={mission.selection as ClientInternalEffect}
          handleChange={handleChange}
        />
      )
    }
    // Otherwise, return null.
    else {
      return null
    }
  })

  /**
   * Renders JSX for panel 2 of the resize relationship.
   */
  const renderPanel2 = (): JSX.Element | null => {
    if (nodeStructuringIsActive) {
      return (
        <NodeStructuring
          mission={mission}
          handleChange={handleChange}
          handleCloseRequest={() => activateNodeStructuring(false)}
        />
      )
    } else if (selection instanceof ClientMission) {
      return (
        <MissionEntry
          mission={selection}
          handleChange={handleChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientMissionPrototype) {
      return (
        <PrototypeEntry
          prototype={selection}
          handleChange={handleChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientMissionForce) {
      return (
        <ForceEntry
          force={selection}
          handleChange={handleChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientMissionNode) {
      return (
        <NodeEntry
          node={selection}
          handleChange={handleChange}
          // todo: Move this to PrototypeEntry.
          handleAddRequest={() => {}}
          handleDeleteRequest={() => handleNodeDeleteRequest(selection)}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientMissionAction) {
      return (
        <ActionEntry
          action={selection}
          targetEnvironments={targetEnvironments}
          handleChange={handleChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientInternalEffect) {
      return (
        <InternalEffectEntry
          effect={selection}
          handleChange={handleChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientExternalEffect) {
      return (
        <ExternalEffectEntry
          effect={selection}
          handleChange={handleChange}
          key={selection._id}
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
                  onTabAdd={onTabAdd}
                  onPrototypeSelect={onPrototypeSelect}
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
