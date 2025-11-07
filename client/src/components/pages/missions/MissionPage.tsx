import Prompt from '@client/components/content/communication/Prompt'
import type { TFileReferenceList_P } from '@client/components/content/data/lists/implementations/FileReferenceList'
import FileReferenceList from '@client/components/content/data/lists/implementations/FileReferenceList'
import type { TMissionFileList_P } from '@client/components/content/data/lists/implementations/MissionFileList'
import MissionFileList from '@client/components/content/data/lists/implementations/MissionFileList'
import { useMissionItemButtonCallbacks } from '@client/components/content/data/lists/implementations/missions/item-buttons'
import type { TNavigation_P } from '@client/components/content/general-layout/Navigation'
import {
  HomeButton,
  ProfileButton,
} from '@client/components/content/general-layout/Navigation'
import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelLayout from '@client/components/content/general-layout/panels/PanelLayout'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import type { TCreateEffect_P } from '@client/components/content/session/mission-map/ui/overlay/modals/CreateEffect'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import {
  useGlobalContext,
  useNavigationMiddleware,
} from '@client/context/global'
import { ClientFileReference } from '@client/files/ClientFileReference'
import type { TMetisClientComponents } from '@client/index'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import type { TClientEffectHost } from '@client/missions/effects/ClientEffect'
import { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { ClientMissionPrototype } from '@client/missions/nodes/ClientMissionPrototype'
import { compute } from '@client/toolbox'
import {
  useBeforeunload,
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from '@client/toolbox/hooks'
import type {
  TEffectTrigger,
  TEffectType,
} from '@shared/missions/effects/Effect'
import type {
  MissionComponent,
  TMissionComponentDefect,
} from '@shared/missions/MissionComponent'
import type { TNonEmptyArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useRef, useState } from 'react'
import type { TPage_P } from '..'
import { DefaultPageLayout } from '..'
import type { TMissionPageContextData } from './context'
import { MissionPageContext } from './context'
import ActionEntry from './entries/implementations/ActionEntry'
import EffectEntry from './entries/implementations/EffectEntry'
import ForceEntry from './entries/implementations/ForceEntry'
import MissionEntry from './entries/implementations/MissionEntry'
import MissionFileEntry from './entries/implementations/MissionFileEntry'
import NodeEntry from './entries/implementations/NodeEntry'
import PrototypeEntry from './entries/implementations/PrototypeEntry'
import MissionPageMap from './map/MissionPageMap'
import './MissionPage.scss'
import NodeStructuring from './structures/NodeStructuring'

/**
 * The description for the structure view in the
 * secondary panel of the mission page.
 */
const STRUCTURE_DESCRIPTION =
  'Drag and drop the nodes below to reorder the structure of the mission. Nodes can be placed inside another node to nest nodes. Nodes can also be placed beside each other for more exact placement.'

/**
 * This will render page that allows the user to
 * edit a mission.
 */
export default function MissionPage(
  props: TMissionPage_P,
): TReactElement | null {
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
  } = globalContext.actions
  const missionState = useState<ClientMission>(() => ClientMission.createNew())
  const state: TMissionPage_S = {
    mission: missionState,
    selection: useState<MissionComponent<TMetisClientComponents>>(
      missionState[0].selection,
    ),
    defects: useState<TMissionComponentDefect[]>([]),
    checkForDefects: useState<boolean>(true),
    globalFiles: useState<ClientFileReference[]>([]),
    localFiles: useState<ClientMissionFile[]>([]),
    effectModalActive: useState<boolean>(false),
    effectModalArgs: useState<Pick<TCreateEffect_P<any>, 'host' | 'trigger'>>({
      host: missionState[0],
      trigger: 'session-setup',
    }),
  }
  const [mission, setMission] = state.mission
  const [globalFiles, setGlobalFiles] = state.globalFiles
  const [localFiles, setLocalFiles] = state.localFiles
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(
    props.missionId === null ? true : false,
  )
  const [selection, setSelection] = state.selection
  const [, setEffectModalActive] = state.effectModalActive
  const [, setEffectModalArgs] = state.effectModalArgs
  const [, setDefects] = state.defects
  const [, setCheckForDefects] = state.checkForDefects
  const root = useRef<HTMLDivElement>(null)
  const navButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'save',
        type: 'button',
        icon: 'save',
        description: 'Save changes.',
        permissions: ['missions_write'],
        disabled: !areUnsavedChanges,
        onClick: () => save(),
      },
      {
        key: 'play',
        type: 'button',
        icon: 'play',
        description: 'Play-test mission.',
        permissions: ['sessions_write_native'],
        onClick: async () => {
          await enforceSavePrompt()
          onPlayTestRequest(mission, 'MissionPage')
        },
      },
      {
        key: 'launch',
        type: 'button',
        icon: 'launch',
        description: 'Launch mission as a session.',
        permissions: ['sessions_write_native'],
        onClick: async () => {
          await enforceSavePrompt()
          onLaunchRequest(mission, 'MissionPage')
        },
      },
      {
        key: 'download',
        type: 'button',
        icon: 'download',
        description: 'Export mission to .metis file',
        permissions: ['missions_write'],
        onClick: async () => {
          await enforceSavePrompt()
          onExportRequest(mission)
        },
      },
      {
        key: 'copy',
        type: 'button',
        icon: 'copy',
        description: 'Create a copy of mission',
        permissions: ['missions_write'],
        onClick: async () => {
          await enforceSavePrompt()
          await onCopyRequest(mission)
        },
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete mission',
        disabled: !props.missionId,
        permissions: ['missions_write'],
        onClick: async () => await onDeleteRequest(mission),
      },
      HomeButton(),
      ProfileButton({ middleware: async () => await enforceSavePrompt() }),
    ],
    options: {
      layout: ['<slot>', '<divider>', 'home', 'profile'],
    },
  })

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const { isAuthorized } = useRequireLogin()

  /* -- COMPUTED -- */

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
    let classList = new ClassList('MissionPage', 'Page')

    // Return the list of class names as one string.
    return classList.value
  })

  /**
   * Props for the mission-file list displaying
   * files that are attached to the mission.
   */
  const missionFileListProps: TMissionFileList_P = {
    name: 'Attached to Mission',
    items: localFiles,
    itemsPerPageMin: 4,
    getListButtonPermissions: () => ['missions_write'],
    getItemButtonPermissions: () => ['missions_write'],
    onSelect: (file) => {
      if (viewMode === 'preview') return
      if (file) mission.select(file)
      else mission.deselect()
    },
    onDetachRequest: (file) => {
      if (viewMode === 'preview') return
      // Remove the file from the mission.
      setLocalFiles(localFiles.filter((f) => f._id !== file._id))
      // Re-enable the file-reference in the global files list.
      const fileRefId = file.reference._id
      const fileRef = globalFiles.find(({ _id }) => _id === fileRefId)
      if (fileRef) fileRef.enable()
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
    getListButtonPermissions: () => ['missions_write'],
    getItemButtonPermissions: () => ['missions_write'],
    getItemButtonLabel: (button) => {
      if (button === 'link') return 'Attach to mission'
      else return ''
    },
    onItemDblClick: (reference) => onAttachFileRequest(reference),
    onItemButtonClick: (button, reference) => {
      if (button !== 'link') return
      if (viewMode === 'preview') return
      onAttachFileRequest(reference)
    },
  }

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine }
  })

  /**
   * The current viewing mode of the mission page.
   */
  const viewMode: 'edit' | 'preview' = compute(() =>
    isAuthorized('missions_write') ? 'edit' : 'preview',
  )
  /* -- HANDLERS --
   */

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

        mission.forces.forEach((force) => {
          force.nodes.forEach((node) => {
            if (viewMode === 'preview') {
              node.disable()
            }
          })
        })
        mission.files.forEach((file) => {
          if (viewMode === 'preview') {
            file.disable()
          }
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
    navButtonEngine.setDisabled('save', !areUnsavedChanges)
  }, [areUnsavedChanges])

  // Cleanup when a new effect is created.
  useEffect(() => {
    setEffectModalActive(false)
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

  // Add event listener to watch for when a new
  // prototype is spawned in the mission.
  useEventListener(mission, 'new-prototype', () => setAreUnsavedChanges(true))

  // Update the list of local files when file access
  // is granted or revoked.
  useEventListener(
    mission,
    ['file-access-granted', 'file-access-revoked'],
    () => setLocalFiles(mission.files),
  )

  // Add event listener to watch for a node exclusion
  // request, updating the state accordingly.
  useEventListener(
    mission,
    'set-node-exclusion',
    (component1, ...components) => {
      if (component1!) onChange(component1, ...components)
    },
  )

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
      // If there are unsaved changes, prompt the user.
      if (isAuthorized('missions_write') && areUnsavedChanges) {
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

        // Abort if the user cancels.
        if (choice === 'Cancel') return
      }

      // Resolve after all checks are made.
      resolve()
    })
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
          if (viewMode === 'preview') {
            file.disable()
          } else {
            file.setDisabled(
              mission.files.some((f) => f.reference._id === file._id),
              'File is already attached.',
            )
          }
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
   * @see {@link TMissionPageContextData.activateEffectModal}
   */
  const activateEffectModal = <TType extends TEffectType>(
    host: TClientEffectHost<TType>,
    trigger: TEffectTrigger,
  ) => {
    setEffectModalActive(true)
    setEffectModalArgs({ host, trigger })
  }

  /**
   * Handles when a change is made that would require saving.
   * @param components The components that have been changed.
   */
  const onChange = (
    // ? Is this still necessary?
    ...components: TNonEmptyArray<MissionComponent<TMetisClientComponents>>
  ): void => {
    // Trigger a check for defects, now
    // that a component has changed.
    setCheckForDefects(true)
    setAreUnsavedChanges(true)
    forceUpdate()
  }

  const {
    onPlayTestRequest,
    onLaunchRequest,
    onExportRequest,
    onCopyRequest,
    onDeleteRequest,
  } = useMissionItemButtonCallbacks({
    onSuccessfulCopy: async (resultingMission) => {
      let { choice } = await prompt(
        'Would you like to open the copied mission?',
        Prompt.YesNoChoices,
      )
      if (choice === 'Yes') {
        navigateTo('MissionPage', {
          missionId: resultingMission._id,
        })
      }
    },
    onSuccessfulDeletion: () => {
      navigateTo('HomePage', {})
    },
  })

  /**
   * Handles the request to attach a file to the mission.
   * This will add the file to the mission's local files
   * and disable the file-reference in the global files list.
   * @param reference The file reference to attach.
   */
  const onAttachFileRequest = (reference: ClientFileReference): void => {
    if (viewMode === 'preview') return
    if (mission.files.some((f) => f.reference._id === reference._id)) return
    // Add new file to the mission.
    let file = ClientMissionFile.fromFileReference(reference, mission)
    setLocalFiles([...localFiles, file])
    // Disable the file-reference in the list.
    reference.disable('File is already attached.')

    onChange(file)
  }

  /* -- RENDER -- */

  /**
   * Renders JSX for the inspector view of the
   * mission page.
   */
  const renderInspector = (): TReactElement | null => {
    if (selection instanceof ClientMission) {
      return <MissionEntry key={selection._id} mission={selection} />
    } else if (selection instanceof ClientMissionFile) {
      return <MissionFileEntry key={selection._id} file={selection} />
    } else if (selection instanceof ClientMissionPrototype) {
      return <PrototypeEntry key={selection._id} prototype={selection} />
    } else if (selection instanceof ClientMissionForce) {
      return <ForceEntry key={selection._id} force={selection} />
    } else if (selection instanceof ClientMissionNode) {
      return <NodeEntry key={selection._id} node={selection} />
    } else if (selection instanceof ClientMissionAction) {
      return <ActionEntry action={selection} key={selection._id} />
    } else if (selection instanceof ClientEffect) {
      return <EffectEntry effect={selection} key={selection._id} />
    } else {
      return null
    }
  }

  /**
   * The value to provide to the context.
   */
  const contextValue: TMissionPageContextData = {
    root,
    ...props,
    state,
    viewMode,
    onChange,
    activateEffectModal,
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
                <MissionPageMap />
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

/* -- TYPES -- */

/**
 * Props for {@link MissionPage}.
 */
export interface TMissionPage_P extends TPage_P {
  /**
   * The ID of the mission to be edited. If null,
   * a new mission is being created.
   */
  missionId: string | null
}

/**
 * State for {@link MissionPage}.
 */
export type TMissionPage_S = {
  /**
   * The current mission being viewed/edited.
   */
  mission: TReactState<ClientMission>
  /**
   * The current selection within the mission.
   */
  selection: TReactState<MissionComponent<TMetisClientComponents>>
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
  /**
   * The current list of files available in the store.
   */
  globalFiles: TReactState<ClientFileReference[]>
  /**
   * The current list of files attached to the mission.
   */
  localFiles: TReactState<ClientMissionFile[]>
  /**
   * Whether the effect modal is currently active.
   */
  effectModalActive: TReactState<boolean>
  /**
   * Arguments to pass to the effect modal when active.
   */
  effectModalArgs: TReactState<Pick<TCreateEffect_P, 'host' | 'trigger'>>
}
