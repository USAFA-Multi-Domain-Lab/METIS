import React, { useContext, useEffect, useRef, useState } from 'react'
import { useBeforeunload } from 'react-beforeunload'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import ClientFileReference from 'src/files/references'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype, {
  TPrototypeDeleteMethod,
} from 'src/missions/nodes/prototypes'
import PrototypeCreation from 'src/missions/transformations/creations'
import PrototypeTranslation from 'src/missions/transformations/translations'
import SessionClient from 'src/sessions'
import { compute, getOs } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import Mission, { TMissionComponent } from '../../../../shared/missions'
import { TNonEmptyArray } from '../../../../shared/toolbox/arrays'
import { TSingleTypeMapped, TWithKey } from '../../../../shared/toolbox/objects'
import Prompt from '../content/communication/Prompt'
import FileReferenceList from '../content/data/lists/implementations/FileReferenceList'
import ActionEntry from '../content/edit-mission/entries/implementations/ActionEntry'
import EffectEntry from '../content/edit-mission/entries/implementations/EffectEntry'
import ForceEntry from '../content/edit-mission/entries/implementations/ForceEntry'
import MissionEntry from '../content/edit-mission/entries/implementations/MissionEntry'
import NodeEntry from '../content/edit-mission/entries/implementations/NodeEntry'
import PrototypeEntry from '../content/edit-mission/entries/implementations/PrototypeEntry'
import NodeStructuring from '../content/edit-mission/NodeStructuring'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import Panel from '../content/general-layout/panels/Panel'
import PanelLayout from '../content/general-layout/panels/PanelLayout'
import PanelView from '../content/general-layout/panels/PanelView'
import MissionMap from '../content/session/mission-map'
import { TNodeButton } from '../content/session/mission-map/objects/nodes'
import CreateEffect from '../content/session/mission-map/ui/overlay/modals/CreateEffect'
import { TTabBarTab } from '../content/session/mission-map/ui/tabs/TabBar'
import {
  TButtonSvg_P,
  TButtonSvg_PK,
  TButtonSvgType,
} from '../content/user-controls/buttons/ButtonSvg'
import './MissionPage.scss'

/**
 * The description for the structure view in the
 * secondary panel of the mission page.
 */
const STRUCTURE_DESCRIPTION =
  'Drag and drop the nodes below to reorder the structure of the mission. Nodes can be placed inside another node to nest nodes. Nodes can also be placed beside each other for more exact placement.'

/**
 * Context for the mission page, which will help distribute
 * mission page properties to its children.
 */
const MissionPageContext = React.createContext<TMissionPageContextData | null>(
  null,
)

/**
 * Hook used by MissionPage-related components to access
 * the mission-page context.
 */
export const useMissionPageContext = () => {
  const context = useContext(
    MissionPageContext,
  ) as TMissionPageContextData | null
  if (!context) {
    throw new Error(
      'useMissionPageContext must be used within an mission-page provider',
    )
  }
  return context
}

/**
 * This will render page that allows the user to
 * edit a mission.
 */
export default function MissionPage(props: TMissionPage_P): JSX.Element | null {
  const Provider =
    MissionPageContext.Provider as React.Provider<TMissionPageContextData>

  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const {
    navigateTo,
    beginLoading,
    finishLoading,
    handleError,
    notify,
    prompt,
    forceUpdate,
    logout,
  } = globalContext.actions
  const [server] = globalContext.server
  const state: TMissionPage_S = {
    defectiveComponents: useState<TMissionComponent<any, any>[]>([]),
  }
  const [mission, setMission] = useState<ClientMission>(new ClientMission())
  const [globalFiles, setGlobalFiles] = useState<ClientFileReference[]>([])
  const selectedForceState = useState<ClientMissionForce | null>(null)
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(
    props.missionId === null ? true : false,
  )
  const [selection, setSelection] = useState<TMissionComponent<any, any>>(
    mission.selection,
  )
  const [isNewEffect, setIsNewEffect] = useState<boolean>(false)
  const [defectiveComponents, setDefectiveComponents] =
    state.defectiveComponents
  const root = useRef<HTMLDivElement>(null)

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const { login, isAuthorized, authorize } = useRequireLogin()

  /* -- COMPUTED -- */

  /**
   * Logout link for navigation.
   */
  const logoutLink = compute(() => ({
    text: 'Log out',
    onClick: () => enforceSavePrompt().then(logout),
    key: 'logout',
  }))

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext), logoutLink],
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
   * Whether the add button for the tab bar
   * is enabled (Enables/Disables force creation).
   */
  const tabAddEnabled: boolean = compute(
    () =>
      mission.forces.length < Mission.MAX_FORCE_COUNT &&
      isAuthorized('missions_write'),
  )

  /**
   * The class name for the root element.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['MissionPage', 'Page']

    // If disabled is true then add the
    // disabled class name.
    if (!isAuthorized('missions_write')) {
      classList.push('ReadOnly')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })

  /**
   * The option buttons for a tab's option menu.
   * @note A tab can be found in the mission map's tab bar.
   * @note The tab's option menu is displayed when the tab is right-clicked.
   */
  const menuOptions = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // If the user has the proper authorization, add
    // the copy button.
    if (login.user.isAuthorized('missions_write')) {
      results.push('copy', 'remove')
    }

    return results
  })

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler(async (done) => {
    // Make sure the user has access to the page.
    if (!isAuthorized('missions_write') && !isAuthorized('missions_read')) {
      handleError(
        'You do not have access to this page. Please contact an administrator.',
      )
      return done()
    }

    // Handle the editing of an existing mission.
    if (props.missionId !== null) {
      try {
        beginLoading('Loading mission...')
        let mission = await ClientMission.$fetchOne(props.missionId, {
          nonRevealedDisplayMode: 'show',
        })
        setMission(mission)
        setSelection(mission)
        setDefectiveComponents(mission.defectiveComponents)

        beginLoading('Loading global files...')
        // The user currently logged in must
        // have restricted access to view the
        // files.
        // todo: Add proper authorization logic.
        if (true) {
          await loadGlobalFiles()
        }
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
    (to, next) => enforceSavePrompt().then(next),
    [areUnsavedChanges],
  )

  // Add an event listener to listen for cmd+s/ctrl+s
  // key presses to save the mission.
  useEventListener(
    document,
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        save()
      }
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
      let prevSelection = selection
      let nextSelection = mission.selection
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
            type: 'cancel',
            key: 'node-button-deselect',
            description: 'Deselect this node (Closes panel view also).',
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
            type: 'cancel',
            key: 'prototype-button-deselect',
            description: 'Deselect this prototype (Closes panel view also).',
            onClick: () => mission.deselect(),
          } as TNodeButton<ClientMissionPrototype>,
          add: {
            type: 'add',
            key: 'prototype-button-add',
            description: 'Create an adjacent prototype on the map.',
            onClick: (_, prototype) => {
              onPrototypeAddRequest(prototype)
            },
          } as TNodeButton<ClientMissionPrototype>,
          move: {
            type: 'reorder',
            key: 'prototype-button-move',
            description: 'Move this prototype to another location.',
            onClick: (_, prototype) => {
              onPrototypeMoveRequest(prototype)
            },
          } as TNodeButton<ClientMissionPrototype>,
          transform_cancel: {
            type: 'cancel',
            key: 'prototype-button-add-cancel',
            description: 'Cancel action.',
            onClick: () => (mission.transformation = null),
          } as TNodeButton<ClientMissionPrototype>,
          remove: {
            type: 'remove',
            key: 'prototype-button-remove',
            description: 'Delete this prototype.',
            disabled: mission.prototypes.length < 2 ? 'full' : 'none',
            onClick: (_, prototype) => {
              onPrototypeDeleteRequest(prototype)
            },
          } as TNodeButton<ClientMissionPrototype>,
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
      notify('Mission failed to save.')
      setAreUnsavedChanges(true)
    }
  }

  /**
   * Ensures any unsaved changes are addressed before
   * any further action is taken.
   * @resolves If the user either saves or discards the changes.
   * If the user cancels, the promise will never resolve.
   * @example
   * ```typescript
   * const saveSensitiveOperation = async () => {
   *   // Enforce the save prompt, only allowing
   *   // this function to perform its operation
   *   // once any unsaved changes, if there any,
   *   // are addressed.
   *   await enforceSavePrompt()
   *
   *   // Then, perform the sensitive operation.
   *   // If the user cancels the save prompt, this
   *   // code will never be reached.
   *   // ...
   * }
   * ```
   */
  const enforceSavePrompt = async (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      // If there are unsaved changes, prompt the user.
      if (areUnsavedChanges) {
        const { choice } = await prompt(
          'You have unsaved changes. What do you want to do with them?',
          ['Cancel', 'Save', 'Discard'],
        )

        // If the user opted to save, then save
        // the mission.
        if (choice === 'Save') {
          beginLoading('Saving...')
          await save()
          finishLoading()
        }

        // Then, unless the user cancelled, resolve.
        if (choice !== 'Cancel') resolve()
      } else {
        resolve()
      }
    })
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

      onChange(newAction)
    }
  }

  /**
   * This loads the global files into the state for
   * display and selection.
   */
  const loadGlobalFiles = (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        beginLoading('Retrieving files...')
        // Fetch files from API and store
        // them in the state.
        setGlobalFiles(await ClientFileReference.$fetchAll())
        // Finish loading and resolve.
        finishLoading()
        resolve()
      } catch (error) {
        handleError('Failed to retrieve files.')
        finishLoading()
        reject(error)
      }
    })
  }

  /**
   * Handles when a change is made that would require saving.
   * @param components The components that have been changed.
   */
  const onChange = (
    ...components: TNonEmptyArray<TMissionComponent<any, any>>
  ): void => {
    let updatedState = defectiveComponents

    // todo: Store last changed component for efficiency purposes.
    components.forEach((component) => {
      // If the component was defective and is no
      // longer defective, then remove it from the
      // list.
      if (defectiveComponents.includes(component) && !component.defective) {
        updatedState = updatedState.filter((c) => c._id !== component._id)
      }
    })

    setDefectiveComponents(updatedState)
    setAreUnsavedChanges(true)
    forceUpdate()
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
    onChange(prototype)
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

      // Allow the user to save the changes.
      onChange(action)
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

    // Allow the user to save the changes.
    onChange(effect)
  }

  /**
   * Gets the description for an option button found in a tab's option menu.
   * @param button The button for which to get the tooltip.
   * @returns The description for the button.
   * @note A tab can be found in the mission map's tab bar.
   * @note The tab's option menu is displayed when the tab is right-clicked.
   */
  const getOptionDescription = (button: TButtonSvgType) => {
    switch (button) {
      case 'copy':
        return 'Duplicate'
      case 'remove':
        return 'Delete'
      default:
        return ''
    }
  }

  /**
   * Handles the request to duplicate a force in the mission.
   * @param forceId The ID of the force to duplicate.
   */
  const handleDuplicateForceRequest = async (
    forceId: ClientMissionForce['_id'],
  ) => {
    // Get the force to duplicate.
    let force = mission.getForce(forceId)

    // If the force is not found, notify the user.
    if (!force) {
      notify('Failed to duplicate force.')
      return
    }

    // Prompt the user to enter the name of the new force.
    let { choice, text } = await prompt(
      'Enter the name of the new force:',
      ['Cancel', 'Submit'],
      {
        textField: { boundChoices: ['Submit'], label: 'Name' },
        defaultChoice: 'Submit',
      },
    )

    // If the user confirms the duplication, proceed.
    if (choice === 'Submit') {
      try {
        // Duplicate the force.
        let newForces = mission.duplicateForces({
          originalId: force._id,
          duplicateName: text,
        })
        // Notify the user that the force was duplicated.
        notify(`Successfully duplicated "${force.name}".`)
        // Allow the user to save the changes.
        onChange(...newForces)
      } catch (error: any) {
        notify(`Failed to duplicate "${force.name}".`)
      }
    }
  }

  /**
   * Handles the request to delete a force.
   * @param forceId The ID of the force to delete.
   */
  const handleDeleteForceRequest = async (
    forceId: ClientMissionForce['_id'],
  ) => {
    // Get the force to duplicate.
    let force = mission.getForce(forceId)

    // If the force is not found, notify the user.
    if (!force) {
      notify('Failed to delete the selected force.')
      return
    }

    // Prompt the user to confirm the deletion.
    let { choice } = await prompt(
      `Please confirm the deletion of this force.`,
      Prompt.ConfirmationChoices,
    )
    // If the user cancels, abort.
    if (choice === 'Cancel') return
    // Delete the force.
    let deletedForces = mission.deleteForces(forceId)

    // Allow the user to save the changes.
    if (deletedForces.length) {
      onChange(...(deletedForces as TNonEmptyArray<ClientMissionForce>))
    }
  }

  /**
   * Handles the request for clicking an option button found in a tab's option menu.
   * @param button The button that was clicked.
   * @param force The force that the button was clicked on.
   * @note A tab can be found in the mission map's tab bar.
   * @note The tab's option menu is displayed when the tab is right-clicked.
   */
  const onOptionClick = (button: TButtonSvgType, tabBarItem: TTabBarTab) => {
    switch (button) {
      case 'copy':
        handleDuplicateForceRequest(tabBarItem._id)
        break
      case 'remove':
        handleDeleteForceRequest(tabBarItem._id)
        break
      default:
        console.warn('Unknown button clicked in mission list.')
        break
    }
  }

  /**
   * Handles the request to play-test the mission.
   */
  const onPlayTest = async () => {
    try {
      // Ensure any unsaved changes are addressed,
      // before proceeding.
      await enforceSavePrompt()

      // If the server connection is not available, abort.
      if (!server) {
        throw new Error('Server connection is not available.')
      }

      // Launch, join, and start the session.
      let sessionId = await SessionClient.$launch(mission._id, {
        accessibility: 'testing',
      })
      let session = await server.$joinSession(sessionId)
      // If the session is not found, abort.
      if (!session) throw new Error('Failed to join test session.')
      session.$start()

      // Navigate to the session page.
      navigateTo('SessionPage', { session }, { bypassMiddleware: true })
    } catch (error) {
      console.error('Failed to play-test mission.')
      console.error(error)
      handleError({
        message: 'Failed to play-test mission.',
        notifyMethod: 'bubble',
      })
    }
  }

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * Custom buttons for the mission map.
   */
  const mapCustomButtons: TWithKey<TButtonSvg_P>[] = compute(() => {
    // Define the buttons that will be used.
    let buttons: TWithKey<TButtonSvg_PK>[] = []

    let commandKey: string = getOs() === 'mac-os' ? 'Cmd' : 'Ctrl'

    const availableButtons: TSingleTypeMapped<'play' | 'save', TButtonSvg_PK> =
      {
        play: {
          type: 'play',
          key: 'play',
          onClick: onPlayTest,
          description: 'Play-test the mission.',
        },
        save: {
          type: 'save',
          key: 'save',
          onClick: save,
          description: `Save changes. \`${commandKey}+S\``,
          disabled: !areUnsavedChanges ? 'full' : 'none',
        },
      }

    // Pushes a button from available buttons to the list.
    const pushButton = (type: keyof typeof availableButtons) =>
      buttons.push(availableButtons[type])

    // Add the play button, if authorized.
    authorize('sessions_write_native', () => pushButton('play'))
    // Add reorder and save buttons, if authorized.
    authorize('missions_write', () => {
      pushButton('save')
    })

    // Return the buttons.
    return buttons
  })

  /**
   * Tabs for the mission map's tab bar.
   */
  const mapTabs: TTabBarTab[] = compute(() => {
    let tabs: TTabBarTab[] = mission.forces.map((force) => {
      return {
        _id: force._id,
        text: force.name,
        color: force.color,
        description: `Select force` + `\n\t\n\`R-Click\` for more options`,
        menuOptions,
        getOptionDescription,
        onOptionClick,
      }
    })

    return tabs
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
          onChange={onChange}
        />
      )
    }
    // Otherwise, return null.
    else {
      return null
    }
  })

  /**
   * Renders JSX for the inspector view of the
   * mission page.
   */
  const renderInspector = (): JSX.Element | null => {
    // if ('a' === 'a') {
    //   return null
    // }
    if (selection instanceof ClientMission) {
      return (
        <MissionEntry
          mission={selection}
          onChange={onChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientMissionPrototype) {
      return (
        <PrototypeEntry
          key={selection._id}
          prototype={selection}
          onChange={onChange}
          onAddRequest={() => onPrototypeAddRequest(selection)}
          onDeleteRequest={() => onPrototypeDeleteRequest(selection)}
        />
      )
    } else if (selection instanceof ClientMissionForce) {
      return (
        <ForceEntry
          force={selection}
          duplicateForce={async () =>
            await handleDuplicateForceRequest(selection._id)
          }
          deleteForce={async () =>
            await handleDeleteForceRequest(selection._id)
          }
          onChange={onChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientMissionNode) {
      return (
        <NodeEntry
          key={selection._id}
          node={selection}
          handleDeleteActionRequest={handleDeleteActionRequest}
          onChange={onChange}
        />
      )
    } else if (selection instanceof ClientMissionAction) {
      return (
        <ActionEntry
          action={selection}
          setIsNewEffect={setIsNewEffect}
          handleDeleteActionRequest={handleDeleteActionRequest}
          handleDeleteEffectRequest={handleDeleteEffectRequest}
          onChange={onChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientEffect) {
      return (
        <EffectEntry
          effect={selection}
          handleDeleteEffectRequest={handleDeleteEffectRequest}
          onChange={onChange}
          key={selection._id}
        />
      )
    } else {
      return null
    }
  }

  /**
   * The value to provide to the context.
   */
  const contextValue = {
    root,
    ...props,
    state,
  }

  /* -- RENDER -- */

  // Don't render if the mount hasn't yet been handled.
  if (!mountHandled) return null

  return (
    <Provider value={contextValue}>
      <div className={rootClassName} ref={root}>
        <DefaultLayout navigation={navigation}>
          <PanelLayout initialSizes={['fill', panel2DefaultSize]}>
            <Panel>
              <PanelView title='Map'>
                <MissionMap
                  mission={mission}
                  customButtons={mapCustomButtons}
                  tabs={mapTabs}
                  tabAddEnabled={tabAddEnabled}
                  onTabAdd={onTabAdd}
                  onPrototypeSelect={onPrototypeSelect}
                  onNodeSelect={onNodeSelect}
                  overlayContent={modalJsx}
                  selectedForce={selectedForceState}
                />
              </PanelView>
              <PanelView title='Files'>
                <div className='InMission'>
                  <FileReferenceList
                    name={'In Mission'}
                    items={mission.files}
                    itemsPerPageMin={4}
                  />
                </div>
                <div className='InStore'>
                  <FileReferenceList
                    name={'In Store'}
                    items={globalFiles}
                    itemButtons={['link']}
                    itemsPerPageMin={4}
                    isDisabled={(file) => mission.files.includes(file)}
                    getItemButtonTooltip={(button, file) => {
                      if (button === 'link') return 'Attach to mission'
                      else return ''
                    }}
                    onItemButtonClick={(button, file) => {
                      if (button !== 'link') return
                      mission.files.push(file)
                      forceUpdate()
                    }}
                  />
                </div>
              </PanelView>
            </Panel>
            <Panel>
              <PanelView title='Inspector'>{renderInspector()}</PanelView>
              <PanelView title='Structure' description={STRUCTURE_DESCRIPTION}>
                <NodeStructuring mission={mission} onChange={onChange} />
              </PanelView>
            </Panel>
          </PanelLayout>
        </DefaultLayout>
      </div>
    </Provider>
  )
}

/* ---------------------------- TYPES FOR MISSION PAGE ---------------------------- */

export interface TMissionPage_P extends TPage_P {
  /**
   * The ID of the mission to be edited. If null,
   * a new mission is being created.
   */
  missionId: string | null
}

/**
 * The state for `MissionPage`, provided
 * in the context.
 */
export type TMissionPage_S = {
  /**
   * The defected components that are currently
   * tracked within the mission.
   */
  defectiveComponents: TReactState<TMissionComponent<any, any>[]>
}

/**
 * The mission-page context data provided to all children
 * of `MissionPage`.
 */
export type TMissionPageContextData = {
  /**
   * The ref for the root element of the mission page.
   */
  root: React.RefObject<HTMLDivElement>
} & Required<TMissionPage_P> & {
    /**
     * The state for the mission page.
     */
    state: TMissionPage_S
  }
