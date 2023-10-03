import { useBeforeunload } from 'react-beforeunload'
import { useState } from 'react'
import { EAjaxStatus } from '../../../../shared/toolbox/ajax'
import MissionMap from '../content/game/MissionMap'
import './MissionFormPage.scss'
import { IPage } from '../App'
import Navigation from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import MissionEntry from '../content/edit-mission/MissionEntry'
import NodeEntry from '../content/edit-mission/NodeEntry'
import NodeStructuring from '../content/edit-mission/NodeStructuring'
import { useMountHandler } from 'src/toolbox/hooks'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionNode, { ENodeDeleteMethod } from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'

export interface IMissionFormPage extends IPage {
  // If null, a new mission is being
  // created.
  missionID: string | null
}

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function MissionFormPage(
  props: IMissionFormPage,
): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [notifications] = globalContext.notifications
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    goToPage,
    confirm,
    logout,
  } = globalContext.actions

  /* -- COMPONENT STATE -- */

  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [mission, setMission] = useState<ClientMission>(new ClientMission())
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [selectedNode, setSelectedNode] = useState<ClientMissionNode | null>(
    null,
  )
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)
  const [displayedAction, setDisplayedAction] = useState<number>(0)
  const [missionEmptyStringArray, setMissionEmptyStringArray] = useState<
    Array<string>
  >([])
  const [nodeEmptyStringArray, setNodeEmptyStringArray] = useState<
    Array<string>
  >([])
  const [actionEmptyStringArray, setActionEmptyStringArray] = useState<
    Array<string>
  >([])

  /* -- COMPONENT EFFECTS -- */

  useMountHandler(async (done) => {
    let missionID: string | null = props.missionID

    // Handle the editing of an existing user.
    if (missionID !== null) {
      try {
        beginLoading('Loading mission...')
        setMission(await ClientMission.fetchOne(missionID, { openAll: true }))
      } catch {
        handleError('Failed to load mission.')
      }
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

  let missionDetailsIsActive: boolean =
    selectedNode === null && !nodeStructuringIsActive

  /* -- COMPONENT FUNCTIONS -- */

  // Forces a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // This is called when a change is
  // made that would require saving.
  const handleChange = (): void => {
    setAreUnsavedChanges(true)

    if (mission.nodeCreationTarget !== null && selectedNode !== null) {
      mission.nodeCreationTarget = null
    }

    forceUpdate()
  }

  // This will select or unselect a node
  const selectNode = (node: ClientMissionNode | null) => {
    if (selectedNode !== null) {
      mission.nodeCreationTarget = null
    }

    setSelectedNode(node)
    setDisplayedAction(0)
    activateNodeStructuring(false)
    setMissionEmptyStringArray([])
    setNodeEmptyStringArray([])
    setActionEmptyStringArray([])
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

  // If a node is deleted, and no remain
  // in the mission, one is auto-generated.
  // If this has happened, the user is
  // notified here.
  const ensureOneNodeExists = (): void => {
    if (
      mission.nodes.size === 1 &&
      mission.lastCreatedNode?.nodeID ===
        Array.from(mission.nodes.values())[0].nodeID
    ) {
      notify(
        'Auto-generated a node for this mission, since missions must have at least one node.',
      )
    }
  }

  // If a node is selected and is executable,
  // this ensures that at least on action
  // exists.
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
      selectedNode.actions.set(newAction.actionID, newAction)

      notify(
        `Auto-generated an action for ${selectedNode.name} because it is an executable node with no actions to execute.`,
      )

      handleChange()
    }
  }

  // This is called when a node is
  // requested to be deleted.
  const handleNodeDeleteRequest = (): void => {
    if (selectedNode !== null) {
      if (selectedNode.hasChildren) {
        confirm(
          `**Note: This node has children** \n` +
            `Please confirm if you would like to delete "${selectedNode.name}" only or "${selectedNode.name}" and all of it's children.`,
          (concludeAction: () => void) => {
            selectedNode.delete({
              deleteMethod: ENodeDeleteMethod.DeleteNodeAndChildren,
            })
            handleChange()
            activateNodeStructuring(false)
            selectNode(null)
            ensureOneNodeExists()
            concludeAction()
          },
          {
            handleAlternate: (concludeAction: () => void) => {
              selectedNode.delete({
                deleteMethod: ENodeDeleteMethod.DeleteNodeAndShiftChildren,
              })
              handleChange()
              activateNodeStructuring(false)
              selectNode(null)
              ensureOneNodeExists()
              concludeAction()
            },
            buttonConfirmText: `Node + Children`,
            buttonAlternateText: `Node`,
          },
        )
      } else {
        confirm(
          'Please confirm the deletion of this node.',
          (concludeAction: () => void) => {
            selectedNode.delete()
            handleChange()
            activateNodeStructuring(false)
            selectNode(null)
            ensureOneNodeExists()
            concludeAction()
          },
        )
      }
    }
  }

  /**
   * Handler for when the user requests to add a new node.
   */
  const handleNodeAddRequest = (): void => {
    if (selectedNode !== null) {
      mission.nodeCreationTarget = selectedNode
    }
  }

  // This verifies that node selection
  // is able to change.
  const validateNodeSelectionChange = (
    onValid: () => void,
    onInvalid: () => void = () => {},
  ): void => {
    if (missionDetailsIsActive && missionEmptyStringArray.length > 0) {
      notify(
        `**Error:** The mission side panel has at least one field that was left empty. This field must contain at least one character.`,
        { duration: null, errorMessage: true },
      )
      return onInvalid()
    }
    if (
      selectedNode !== null &&
      (nodeEmptyStringArray.length > 0 || actionEmptyStringArray.length > 0)
    ) {
      notify(
        `**Error:** The node called "${selectedNode.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
        { duration: null, errorMessage: true },
      )
      return onInvalid()
    }
    return onValid()
  }

  // This will redirect the user to the
  // home page.
  const goHome = (): void => {
    if (!areUnsavedChanges) {
      goToPage('HomePage', {})
    } else {
      confirm(
        'You have unsaved changes. What do you want to do with them?',
        async (concludeAction: () => void) => {
          await save().catch(() => {})
          goToPage('HomePage', {})
          concludeAction()
        },
        {
          handleAlternate: (concludeAction: () => void) => {
            goToPage('HomePage', {})
            concludeAction()
          },
          pendingMessageUponConfirm: 'Saving...',
          pendingMessageUponAlternate: 'Discarding...',
          buttonConfirmText: 'Save',
          buttonAlternateText: 'Discard',
        },
      )
    }
  }

  // This will redirect the user to the
  // game page.
  const goToGamePage = (): void => {
    if (!areUnsavedChanges) {
      goToPage('GamePage', {
        missionID: mission.missionID,
      })
    } else {
      confirm(
        'You have unsaved changes. What do you want to do with them?',
        async (concludeAction: () => void) => {
          await save().catch(() => {})
          goToPage('GamePage', {})
          concludeAction()
        },
        {
          handleAlternate: (concludeAction: () => void) => {
            goToPage('GamePage', {
              missionID: mission.missionID,
            })
            concludeAction()
          },
          pendingMessageUponConfirm: 'Saving...',
          pendingMessageUponAlternate: 'Discarding...',
          buttonConfirmText: 'Save',
          buttonAlternateText: 'Discard',
        },
      )
    }
  }

  /* -- RENDER -- */

  let isEmptyString: boolean =
    missionEmptyStringArray.length > 0 ||
    nodeEmptyStringArray.length > 0 ||
    actionEmptyStringArray.length > 0
  let grayOutSaveButton: boolean = !areUnsavedChanges || isEmptyString
  let grayOutEditButton: boolean = nodeStructuringIsActive || isEmptyString
  let grayOutDeselectNodeButton: boolean = isEmptyString
  let grayOutAddNodeButton: boolean = isEmptyString
  let grayOutDeleteNodeButton: boolean = mission.nodes.size < 2

  if (!isEmptyString) {
    for (let notification of notifications) {
      if (notification.errorMessage) {
        setTimeout(() => {
          notification.dismiss()
        }, 2000)
      }
    }
  }

  return (
    <div className={'MissionFormPage Page'}>
      {/* -- NAVIGATION */}
      <Navigation
        links={[
          {
            text: 'Done',
            handleClick: goHome,
            visible: true,
            key: 'done',
          },
          {
            text: 'Play test',
            handleClick: goToGamePage,
            visible: true,
            key: 'play-test',
          },
          {
            text: 'Log out',
            handleClick: () =>
              logout({
                returningPagePath: 'HomePage',
                returningPageProps: {},
              }),
            visible: true,
            key: 'log-out',
          },
        ]}
        brandingCallback={goHome}
        brandingTooltipDescription='Go home.'
      />

      {/* -- CONTENT -- */}
      <div className='Content'>
        <PanelSizeRelationship
          panel1={{
            ...ResizablePanel.defaultProps,
            minSize: 330,
            render: () => (
              <MissionMap
                mission={mission}
                missionAjaxStatus={EAjaxStatus.Loaded}
                selectedNode={selectedNode}
                allowCreationMode={true}
                handleNodeSelection={(node: ClientMissionNode) => {
                  validateNodeSelectionChange(() => {
                    selectNode(node)
                    ensureOneActionExistsIfExecutable()
                  })
                }}
                handleNodeCreation={(node: ClientMissionNode) => {
                  setSelectedNode(node)
                  handleChange()
                }}
                handleNodeDeselection={() => {
                  validateNodeSelectionChange(() => {
                    selectNode(null)
                  })
                }}
                handleNodeDeletionRequest={handleNodeDeleteRequest}
                handleMapEditRequest={() => {
                  selectNode(null)
                  activateNodeStructuring(true)
                }}
                handleMapSaveRequest={save}
                grayOutEditButton={grayOutEditButton}
                grayOutSaveButton={grayOutSaveButton}
                grayOutDeselectNodeButton={grayOutDeselectNodeButton}
                grayOutAddNodeButton={grayOutAddNodeButton}
                grayOutDeleteNodeButton={grayOutDeleteNodeButton}
                applyNodeClassName={(node: ClientMissionNode) => ''}
                renderNodeTooltipDescription={(node: ClientMissionNode) => ''}
              />
            ),
          }}
          panel2={{
            ...ResizablePanel.defaultProps,
            minSize: 330,
            render: () => {
              if (missionDetailsIsActive) {
                return (
                  <MissionEntry
                    active={missionDetailsIsActive}
                    mission={mission}
                    missionEmptyStringArray={missionEmptyStringArray}
                    setMissionEmptyStringArray={setMissionEmptyStringArray}
                    handleChange={handleChange}
                  />
                )
              } else if (selectedNode !== null) {
                return (
                  <NodeEntry
                    node={selectedNode}
                    displayedAction={displayedAction}
                    setDisplayedAction={setDisplayedAction}
                    nodeEmptyStringArray={nodeEmptyStringArray}
                    setNodeEmptyStringArray={setNodeEmptyStringArray}
                    actionEmptyStringArray={actionEmptyStringArray}
                    setActionEmptyStringArray={setActionEmptyStringArray}
                    handleChange={handleChange}
                    handleAddRequest={handleNodeAddRequest}
                    handleDeleteRequest={handleNodeDeleteRequest}
                    handleCloseRequest={() => {
                      validateNodeSelectionChange(() => {
                        selectNode(null)
                      })
                    }}
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
            },
          }}
          sizingMode={EPanelSizingMode.Panel1_Auto__Panel2_Defined}
          initialDefinedSize={330}
        />
      </div>

      {/* -- FOOTER -- */}
      <div className='FooterContainer'>
        <a
          href='https://www.midjourney.com/'
          className='Credit'
          draggable={false}
        >
          Photo by Midjourney
        </a>
      </div>
    </div>
  )
}
