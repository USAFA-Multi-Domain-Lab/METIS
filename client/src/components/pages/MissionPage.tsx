import React, { useContext, useEffect, useRef, useState } from 'react'
import { useBeforeunload } from 'react-beforeunload'
import { useGlobalContext, useNavigationMiddleware } from 'src/context/global'
import ClientFileReference from 'src/files/references'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionFile from 'src/missions/files'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype, {
  TPrototypeDeleteMethod,
} from 'src/missions/nodes/prototypes'
import PrototypeCreation from 'src/missions/transformations/creations'
import PrototypeTranslation from 'src/missions/transformations/translations'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { DefaultPageLayout, TPage_P } from '.'
import Mission from '../../../../shared/missions'
import MissionComponent, {
  TMissionComponentDefect,
} from '../../../../shared/missions/component'
import { TNonEmptyArray } from '../../../../shared/toolbox/arrays'
import Prompt from '../content/communication/Prompt'
import FileReferenceList, {
  TFileReferenceList_P,
} from '../content/data/lists/implementations/FileReferenceList'
import MissionFileList, {
  TMissionFileList_P,
} from '../content/data/lists/implementations/MissionFileList'
import ActionEntry from '../content/edit-mission/entries/implementations/ActionEntry'
import EffectEntry from '../content/edit-mission/entries/implementations/EffectEntry'
import ForceEntry from '../content/edit-mission/entries/implementations/ForceEntry'
import MissionEntry from '../content/edit-mission/entries/implementations/MissionEntry'
import MissionFileEntry from '../content/edit-mission/entries/implementations/MissionFileEntry'
import NodeEntry from '../content/edit-mission/entries/implementations/NodeEntry'
import PrototypeEntry from '../content/edit-mission/entries/implementations/PrototypeEntry'
import NodeStructuring from '../content/edit-mission/NodeStructuring'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import Panel from '../content/general-layout/panels/Panel'
import PanelLayout from '../content/general-layout/panels/PanelLayout'
import PanelView from '../content/general-layout/panels/PanelView'
import MissionMap from '../content/session/mission-map/MissionMap'
import CreateEffect from '../content/session/mission-map/ui/overlay/modals/CreateEffect'
import { TTabBarTab } from '../content/session/mission-map/ui/tabs/TabBar'
import { useButtonSvgEngine } from '../content/user-controls/buttons/v3/hooks'
import { TButtonSvg_Input } from '../content/user-controls/buttons/v3/types'
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
    defects: useState<TMissionComponentDefect[]>([]),
    checkForDefects: useState<boolean>(true),
  }
  const [mission, setMission] = useState<ClientMission>(
    ClientMission.createNew(),
  )
  const [globalFiles, setGlobalFiles] = useState<ClientFileReference[]>([])
  const [localFiles, setLocalFiles] = useState<ClientMissionFile[]>([])
  const selectedForceState = useState<ClientMissionForce | null>(null)
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(
    props.missionId === null ? true : false,
  )
  const [selection, setSelection] = useState<MissionComponent<any, any>>(
    mission.selection,
  )
  const [isNewEffect, setIsNewEffect] = useState<boolean>(false)
  const [_, setDefects] = state.defects
  const [__, setCheckForDefects] = state.checkForDefects
  const root = useRef<HTMLDivElement>(null)
  const mapButtonEngine = useButtonSvgEngine({
    buttons: [
      {
        icon: 'play',
        description: 'Play-test the mission.',
        permissions: ['sessions_write_native'],
        onClick: async () => {
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
        },
      },
      {
        icon: 'save',
        description: 'Save changes.',
        permissions: ['missions_write'],
        onClick: () => save(),
      },
    ],
  })
  const nodeButtonEngine = useButtonSvgEngine({})
  const prototypeButtonEngine = useButtonSvgEngine({})

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const { isAuthorized } = useRequireLogin()

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
   * Props for the mission-file list displaying
   * files that are attached to the mission.
   */
  const missionFileListProps: TMissionFileList_P = {
    name: 'Attached to Mission',
    items: localFiles,
    itemsPerPageMin: 4,
    onSelect: (file) => {
      if (file) mission.select(file)
      else mission.deselect()
    },
    onDetachRequest: (file) => {
      setLocalFiles(localFiles.filter((f) => f._id !== file._id))
      file.reference.enable()
      onChange(file)
    },
  }

  /**
   * Props for the file-reference list displaying
   * files available in the store.
   */
  const inStoreListProps: TFileReferenceList_P = {
    name: 'Server Repository',
    files: [globalFiles, setGlobalFiles],
    itemButtonIcons: ['link'],
    itemsPerPageMin: 4,
    getItemButtonLabel: (button) => {
      if (button === 'link') return 'Attach to mission'
      else return ''
    },
    onItemButtonClick: (button, reference) => {
      if (button !== 'link') return

      // Add new file to the mission.
      let file = ClientMissionFile.fromFileReference(reference, mission)
      setLocalFiles([...localFiles, file])
      // Disable the file-reference in the list.
      reference.disable('File is already attached.')

      onChange(file)
    },
  }

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
        setLocalFiles(mission.files)
        setSelection(mission)
        setDefects(mission.defects)

        beginLoading('Loading global files...')

        // The user currently logged in must
        // have restricted access to view the
        // files.
        if (isAuthorized('files_read')) await loadGlobalFiles(mission)
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

  // Update the files in the mission when the
  // local files list changes.
  useEffect(() => {
    mission.files = localFiles
  }, [localFiles])

  // Enable/disable the save button based on
  // whether there are unsaved changes or not.
  useEffect(() => {
    mapButtonEngine.setDisabled('save', !areUnsavedChanges)
  }, [areUnsavedChanges])

  // Cleanup when a new effect is created.
  useEffect(() => {
    if (isNewEffect) setIsNewEffect(false)
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
        nodeButtonEngine.removeAll()
        prevNode.buttons = nodeButtonEngine.buttons
      }

      // If there is a next node, then add the buttons.
      if (nextNode) {
        nodeButtonEngine.add(
          {
            icon: 'cancel',
            description: 'Deselect this node (Closes panel view also).',
            onClick: () => mission.select(nextNode!.force),
          },
          {
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

        nextNode.buttons = nodeButtonEngine.buttons
      }

      // If there is a previous prototype, clear its buttons.
      if (prevSelection instanceof ClientMissionPrototype) {
        prototypeButtonEngine.removeAll()
        prevSelection.buttons = prototypeButtonEngine.buttons
      }

      // If there is a next prototype, then add the buttons.
      if (nextSelection instanceof ClientMissionPrototype) {
        if (mission.transformation) {
          prototypeButtonEngine.add({
            icon: 'cancel',
            description: 'Cancel action.',
            permissions: ['missions_write'],
            onClick: () => (mission.transformation = null),
          })
        } else {
          prototypeButtonEngine.add(
            {
              icon: 'cancel',
              description: 'Deselect this prototype (Closes panel view also).',
              onClick: () => mission.deselect(),
            },
            {
              icon: 'add',
              description: 'Create an adjacent prototype on the map.',
              permissions: ['missions_write'],
              onClick: () =>
                onPrototypeAddRequest(nextSelection as ClientMissionPrototype),
            },
            // todo: Reimplement this once node structure panel
            // todo: is removed.
            // {
            //   icon: 'reorder',
            //   description: 'Move this prototype to another location.',
            //   permissions: ['missions_write'],
            //   onClick: () => onPrototypeMoveRequest(nextSelection),
            // },
            {
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

        nextSelection.buttons = prototypeButtonEngine.buttons
      }

      // Update the selection state.
      setSelection(mission.selection)
    },
    [selection],
  )

  // Add event listener to watch for when a new
  // prototype is spawned in the mission.
  useEventListener(mission, 'new-prototype', () => setAreUnsavedChanges(true))

  // Update the list of local files when file access
  // is granted or revoked.
  useEventListener(
    mission,
    ['file-access-granted', 'file-access-revoked'],
    () => {
      setLocalFiles(mission.files)
    },
  )

  // Add event listener to watch for a node exclusion
  // request, updating the state accordingly.
  useEventListener(mission, 'set-node-exclusion', ([node]) => onChange(node))

  /* -- FUNCTIONS -- */

  /**
   * Saves the mission to the server with
   * any changes made.
   * @returns A promise that resolves when the mission has been saved.
   */
  const save = async () => {
    try {
      if (areUnsavedChanges && isAuthorized('missions_write')) {
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
      // If the user does not have write permissions
      // and there are no unsaved changes, resolve immediately.
      if (!isAuthorized('missions_write') && areUnsavedChanges) {
        return resolve()
      }

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
   * @param mission The current mission being viewed on
   * the page.
   * @resolves When the global files have been loaded.
   * @rejects If the global files could not be loaded.
   */
  const loadGlobalFiles = (mission: ClientMission): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        beginLoading('Retrieving files...')
        // Fetch files from API and store
        // them in the state.
        const globalFiles = await ClientFileReference.$fetchAll()
        // Disable any files that are already in
        // the mission.
        globalFiles.forEach((file) => {
          file.setDisabled(
            mission.files.some((f) => f.reference._id === file._id),
            'File is already attached.',
          )
        })
        setGlobalFiles(globalFiles)
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
    // ? Is this still necessary?
    ...components: TNonEmptyArray<MissionComponent<any, any>>
  ): void => {
    // todo: Remove this, maybe??
    // components.forEach((component) => {
    //   // If the component was defective and is no
    //   // longer defective, then remove it from the
    //   // list.
    //   if (defectiveComponents.includes(component) && !component.defective) {
    //     updatedState = updatedState.filter((c) => c._id !== component._id)
    //   }
    // })

    // Trigger a check for defects, now
    // that a component has changed.
    setCheckForDefects(true)
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
   * Handles the request to duplicate an action.
   * @param action The action to duplicate.
   * @param selectNewAction Whether to select the new action after duplication.
   */
  const onDuplicateActionRequest = async (
    action: ClientMissionAction,
    selectNewAction: boolean = false,
  ) => {
    // Prompt the user to enter the name of the new action.
    let { choice, text } = await prompt(
      'Enter the name of the new action:',
      ['Cancel', 'Submit'],
      {
        textField: { boundChoices: ['Submit'], label: 'Name' },
        defaultChoice: 'Submit',
      },
    )

    // If the user confirms the duplication, proceed.
    if (choice === 'Submit') {
      try {
        const { node } = action
        // Duplicate the action.
        let newAction = action.duplicate({
          name: text,
          localKey: node.generateActionKey(),
        })
        // Add the new action to the node.
        node.actions.set(newAction._id, newAction)
        // Select the new action if necessary.
        if (selectNewAction) mission.select(newAction)
        // Notify the user that the force was duplicated.
        notify(`Successfully duplicated "${newAction.name}".`)
        // Allow the user to save the changes.
        onChange(newAction)
      } catch (error: any) {
        notify(`Failed to duplicate "${action.name}".`)
      }
    }
  }

  /**
   * Handles the request to delete an action.
   */
  const onDeleteActionRequest = async (
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
   * Handles the request to duplicate an effect.
   * @param effect The effect to duplicate.
   * @param selectNewEffect Whether to select the new effect after duplication.
   */
  const onDuplicateEffectRequest = async (
    effect: ClientEffect,
    selectNewEffect: boolean = false,
  ) => {
    // Prompt the user to enter the name of the new effect.
    let { choice, text } = await prompt(
      'Enter the name of the new effect:',
      ['Cancel', 'Submit'],
      {
        textField: { boundChoices: ['Submit'], label: 'Name' },
        defaultChoice: 'Submit',
      },
    )

    // If the user confirms the duplication, proceed.
    if (choice === 'Submit') {
      try {
        const { action } = effect
        // Duplicate the effect.
        let newEffect = effect.duplicate({
          name: text,
          localKey: action.generateEffectKey(),
        })
        // Add the new effect to the action.
        action.effects.push(newEffect)
        // Select the new effect if necessary.
        if (selectNewEffect) mission.select(newEffect)
        // Notify the user that the force was duplicated.
        notify(`Successfully duplicated "${newEffect.name}".`)
        // Allow the user to save the changes.
        onChange(newEffect)
      } catch (error: any) {
        notify(`Failed to duplicate "${effect.name}".`)
      }
    }
  }

  /**
   * Handles the request to delete an effect.
   */
  const onDeleteEffectRequest = async (
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
   * Handles the request to duplicate a force in the mission.
   * @param forceId The ID of the force to duplicate.
   */
  const onDuplicateForceRequest = async (
    forceId: ClientMissionForce['_id'],
  ) => {
    // Get the force to duplicate.
    let force = mission.getForceById(forceId)

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
  const onDeleteForceRequest = async (forceId: ClientMissionForce['_id']) => {
    // Get the force to duplicate.
    let force = mission.getForceById(forceId)

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

  /* -- COMPUTED  (CONTINUED) -- */

  /**
   * Tabs for the mission map's tab bar.
   */
  const mapTabs: TTabBarTab[] = compute(() => {
    return mission.forces.map((force) => {
      const buttons: TButtonSvg_Input[] = [
        {
          icon: 'copy',
          label: 'Duplicate',
          permissions: ['missions_write'],
          onClick: () => onDuplicateForceRequest(force._id),
        },
        {
          icon: 'remove',
          label: 'Delete',
          permissions: ['missions_write'],
          onClick: () => onDeleteForceRequest(force._id),
        },
      ]

      const tab: TTabBarTab = {
        _id: force._id,
        text: force.name,
        color: force.color,
        description: `Select force` + `\n\t\n\`R-Click\` for more options`,
        engineProps: { buttons },
      }

      return tab
    })
  })

  /* -- RENDER -- */

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
    if (selection instanceof ClientMission) {
      return (
        <MissionEntry
          key={selection._id}
          mission={selection}
          onChange={onChange}
        />
      )
    } else if (selection instanceof ClientMissionFile) {
      return (
        <MissionFileEntry
          key={selection._id}
          file={selection}
          onChange={onChange}
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
            await onDuplicateForceRequest(selection._id)
          }
          deleteForce={async () => await onDeleteForceRequest(selection._id)}
          onChange={onChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientMissionNode) {
      return (
        <NodeEntry
          key={selection._id}
          node={selection}
          onDeleteActionRequest={onDeleteActionRequest}
          onDuplicateActionRequest={onDuplicateActionRequest}
          onChange={onChange}
        />
      )
    } else if (selection instanceof ClientMissionAction) {
      return (
        <ActionEntry
          action={selection}
          setIsNewEffect={setIsNewEffect}
          onDuplicateActionRequest={onDuplicateActionRequest}
          onDeleteActionRequest={onDeleteActionRequest}
          onDuplicateEffectRequest={onDuplicateEffectRequest}
          onDeleteEffectRequest={onDeleteEffectRequest}
          onChange={onChange}
          key={selection._id}
        />
      )
    } else if (selection instanceof ClientEffect) {
      return (
        <EffectEntry
          effect={selection}
          onDuplicateEffectRequest={onDuplicateEffectRequest}
          onDeleteEffectRequest={onDeleteEffectRequest}
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

  // Don't render if the mount hasn't yet been handled.
  if (!mountHandled) return null

  return (
    <Provider value={contextValue}>
      <div className={rootClassName} ref={root}>
        <DefaultPageLayout navigation={navigation}>
          <PanelLayout initialSizes={['fill', panel2DefaultSize]}>
            <Panel>
              <PanelView title='Map'>
                <MissionMap
                  mission={mission}
                  buttonEngine={mapButtonEngine}
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
                  <MissionFileList {...missionFileListProps} />
                </div>
                <div className='InStore'>
                  <FileReferenceList {...inStoreListProps} />
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
        </DefaultPageLayout>
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
   * The defects within mission components that must
   * be addressed for the mission to function correctly.
   */
  defects: TReactState<TMissionComponentDefect[]>
  /**
   * Triggers a recomputation of the defective
   * components, updating the state with the result.
   */
  checkForDefects: TReactState<boolean>
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
