import { useEffect, useState } from 'react'
import { useBeforeunload } from 'react-beforeunload'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import ClientMission, { TMissionNavigable } from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype, {
  TPrototypeDeleteMethod,
} from 'src/missions/nodes/prototypes'
import PrototypeCreation from 'src/missions/transformations/creations'
import PrototypeTranslation from 'src/missions/transformations/translations'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import Mission from '../../../../shared/missions'
import { TWithKey } from '../../../../shared/toolbox/objects'
import Prompt from '../content/communication/Prompt'
import ActionEntry from '../content/edit-mission/entries/ActionEntry'
import EffectEntry from '../content/edit-mission/entries/EffectEntry'
import ForceEntry from '../content/edit-mission/entries/ForceEntry'
import MissionEntry from '../content/edit-mission/entries/MissionEntry'
import NodeEntry from '../content/edit-mission/entries/NodeEntry'
import NodeStructuring from '../content/edit-mission/entries/NodeStructuring'
import PrototypeEntry from '../content/edit-mission/entries/PrototypeEntry'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import MissionMap from '../content/session/mission-map'
import { TPrototypeButton } from '../content/session/mission-map/objects/MissionPrototype'
import CreateEffect from '../content/session/mission-map/ui/overlay/modals/CreateEffect'
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
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    prompt,
    forceUpdate,
  } = globalContext.actions

  /* -- STATE -- */

  const [mission, setMission] = useState<ClientMission>(new ClientMission())
  const selectedForceState = useState<ClientMissionForce | null>(null)
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(
    missionId === null ? true : false,
  )
  const [selection, setSelection] = useState<TMissionNavigable>(
    mission.selection,
  )
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)
  const [isNewEffect, setIsNewEffect] = useState<boolean>(false)

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const [login] = useRequireLogin()

  // Grab the user currently logged in.
  let { user: currentUser } = login

  /* -- COMPUTED -- */

  /**
   * Logout link for navigation.
   */
  const logoutLink = compute(() => ({
    text: 'Logout',
    onClick: async () => {
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
            await globalContext.actions.logout()
          }
        } catch (error) {
          return handleError({
            message: 'Failed to save mission.',
            notifyMethod: 'bubble',
          })
        }
      } else {
        await globalContext.actions.logout()
      }
    },
    key: 'logout',
  }))

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext), logoutLink],
      boxShadow: 'alt-6',
    }),
  )

  /**
   * Default size of the side panel.
   */
  const panel2DefaultSize: number = compute(() => {
    let panel2DefaultSize: number = 330 /*px*/
    let currentAspectRatio: number = window.innerWidth / window.innerHeight

    // If the aspect ratio is greater than or equal to 16:9,
    // and the window width is greater than or equal to 1850px,
    // then the default size of the side panel will be 40%
    // of the width of the window.
    if (currentAspectRatio >= 16 / 9 && window.innerWidth >= 1850) {
      panel2DefaultSize = window.innerWidth * 0.4
    }

    return panel2DefaultSize
  })

  /**
   * The class name for the root element.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['MissionPage', 'Page']

    // If disabled is true then add the
    // disabled class name.
    if (!currentUser.isAuthorized('missions_write')) {
      classList.push('ReadOnly')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler(async (done) => {
    // Make sure the user has access to the page.
    if (
      !currentUser.isAuthorized('missions_write') &&
      !currentUser.isAuthorized('missions_read')
    ) {
      handleError(
        'You do not have access to this page. Please contact an administrator.',
      )
      return done()
    }

    // Handle the editing of an existing mission.
    if (missionId !== null) {
      try {
        beginLoading('Loading mission...')
        let mission = await ClientMission.$fetchOne(missionId, {
          nonRevealedDisplayMode: 'show',
          populateTargets: true,
        })
        setMission(mission)
        setSelection(mission)
      } catch {
        handleError('Failed to load mission.')
      }
    } else {
      mission.context = 'edit'
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  // Cleanup when a new effect is created.
  useEffect(() => {
    if (isNewEffect) {
      setIsNewEffect(false)
    }
  }, [selection])

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
      if (areUnsavedChanges && currentUser.isAuthorized('missions_write')) {
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
              onPrototypeAddRequest(prototype)
            },
          } as TPrototypeButton,
          move: {
            icon: 'reorder',
            key: 'prototype-button-move',
            tooltipDescription: 'Move this prototype to another location.',
            onClick: (_, prototype) => {
              onPrototypeMoveRequest(prototype)
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
            disabled: mission.prototypes.length < 2 ? 'full' : 'none',
            onClick: (_, prototype) => {
              onPrototypeDeleteRequest(prototype)
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
    if (
      mission.forces.length >= Mission.MAX_FORCE_COUNT ||
      !currentUser.isAuthorized('missions_write')
    )
      return null

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
   * @param prototype The node to be deleted.
   */
  const onPrototypeDeleteRequest = async (
    prototype: ClientMissionPrototype,
  ): Promise<void> => {
    // Gather details.
    let deleteMethod: TPrototypeDeleteMethod = 'delete-children'
    let message: string
    let choices: ['Cancel', 'Keep Children', 'Delete Children', 'Confirm'] = [
      'Cancel',
      'Keep Children',
      'Delete Children',
      'Confirm',
    ]

    // Set the message and choices based on the prototype's children.
    if (prototype.hasChildren) {
      message = `What would you like to do with the children of "${prototype.name}"?`
      choices.pop()
    } else {
      message = `Please confirm the deletion of "${prototype.name}".`
      choices.splice(1, 2)
    }

    // Prompt the user for confirmation.
    let { choice } = await prompt(message, choices)

    // If the user selects node only, update the delete method.
    if (choice === 'Keep Children') {
      deleteMethod = 'shift-children'
    }
    // Return if the user cancels the deletion.
    else if (choice === 'Cancel') {
      return
    }

    // Delete the node.
    prototype.delete({
      deleteMethod,
    })
    // Handle the change.
    handleChange()
    activateNodeStructuring(false)
    mission.deselect()
  }

  /**
   * Handler for when the user requests to add a new prototype.
   */
  const onPrototypeAddRequest = (prototype: ClientMissionPrototype): void => {
    mission.transformation = new PrototypeCreation(prototype)
  }

  /**
   * Handler for when the user requests to add a new prototype.
   */
  const onPrototypeMoveRequest = (prototype: ClientMissionPrototype): void => {
    mission.transformation = new PrototypeTranslation(prototype)
  }

  /**
   * Handles the request to delete an action.
   */
  const handleDeleteActionRequest = async (
    action: ClientMissionAction,
    navigateBack: boolean = false,
  ) => {
    // Extract the node from the action.
    let node = action.node

    // Delete the action if the node has more than 2 actions.
    if (node.actions.size > 1) {
      // Prompt the user to confirm the deletion.
      let { choice } = await prompt(
        `Please confirm the deletion of this action.`,
        Prompt.ConfirmationChoices,
      )
      // If the user cancels, abort.
      if (choice === 'Cancel') return

      // Go back to the previous selection.
      if (navigateBack) {
        mission.selectBack()
      }

      // Extract the node from the action.
      let { node } = action
      // Remove the action from the node.
      node.actions.delete(action._id)

      // Display the changes.
      forceUpdate()
      // Allow the user to save the changes.
      handleChange()
    }
  }

  /**
   * Handles the request to delete an effect.
   */
  const handleDeleteEffectRequest = async (
    effect: ClientEffect,
    navigateBack: boolean = false,
  ) => {
    // Prompt the user to confirm the deletion.
    let { choice } = await prompt(
      `Please confirm the deletion of this effect.`,
      Prompt.ConfirmationChoices,
    )

    // If the user cancels, abort.
    if (choice === 'Cancel') return

    // Go back to the previous selection.
    if (navigateBack) {
      mission.selectBack()
    }

    // Extract the action from the effect.
    let { action } = effect
    // Filter out the effect from the action.
    action.effects = action.effects.filter(
      (actionEffect: ClientEffect) => actionEffect._id !== effect._id,
    )

    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * Custom buttons for the mission map.
   */
  const mapCustomButtons: TWithKey<TButtonSvg>[] = compute(() => {
    // Define the buttons that will be used.
    let buttons: TWithKey<TButtonSvg>[] = []
    // Define the reorder button.
    let reorderButton: TWithKey<TButtonSvg> = {
      icon: 'reorder',
      key: 'reorder',
      onClick: () => {
        mission.deselect()
        activateNodeStructuring(true)
      },
      tooltipDescription: 'Edit the structure and order of nodes.',
      disabled: nodeStructuringIsActive ? 'full' : 'none',
    }
    // Define the save button.
    let saveButton: TWithKey<TButtonSvg> = {
      icon: 'save',
      key: 'save',
      onClick: save,
      tooltipDescription: 'Save changes.',
      disabled: !areUnsavedChanges ? 'full' : 'none',
    }
    // Add the buttons to the list if the user is authorized.
    if (currentUser.isAuthorized('missions_write')) {
      buttons.push(reorderButton)
      buttons.push(saveButton)
    }
    // Return the buttons.
    return buttons
  })

  /**
   * Computed JSX for the mission map modal.
   */
  const modalJsx = compute((): JSX.Element | null => {
    // If the selection is an action and the user has
    // requested to create a new effect, then display
    // the create effect modal.
    if (selection instanceof ClientMissionAction && isNewEffect) {
      return (
        <CreateEffect
          action={mission.selection as ClientMissionAction}
          setIsNewEffect={setIsNewEffect}
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
          key={selection._id}
          prototype={selection}
          handleChange={handleChange}
          onAddRequest={() => onPrototypeAddRequest(selection)}
          onDeleteRequest={() => onPrototypeDeleteRequest(selection)}
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
          key={selection._id}
          node={selection}
          handleDeleteActionRequest={handleDeleteActionRequest}
          handleChange={handleChange}
        />
      )
    } else if (selection instanceof ClientMissionAction) {
      return (
        <ActionEntry
          action={selection}
          setIsNewEffect={setIsNewEffect}
          handleDeleteActionRequest={handleDeleteActionRequest}
          handleDeleteEffectRequest={handleDeleteEffectRequest}
          handleChange={handleChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientEffect) {
      return (
        <EffectEntry
          effect={selection}
          handleDeleteEffectRequest={handleDeleteEffectRequest}
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
      <div className={rootClassName}>
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
                  selectedForce={selectedForceState}
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
