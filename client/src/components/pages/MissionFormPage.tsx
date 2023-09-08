import { useBeforeunload } from 'react-beforeunload'
import { useState } from 'react'
import Mission, {
  createMission,
  saveMission,
} from '../../../../shared/missions'
import { EAjaxStatus } from '../../../../shared/toolbox/ajax'
import MissionMap from '../content/game/MissionMap'
import './MissionFormPage.scss'
import { IPage } from '../App'
import MissionNode, {
  ENodeDeleteMethod,
} from '../../../../shared/missions/nodes'
import MissionNodeAction from '../../../../shared/missions/actions'
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
  const [mission, setMission] = useState<Mission | null>(null)
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [selectedNode, setSelectedNode] = useState<MissionNode | null>(null)
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)
  const [existsInDatabase, setExistsInDatabase] = useState<boolean>(false)
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
    let existsInDatabase: boolean = missionID !== null

    // Handle the editing of an existing user.
    if (existsInDatabase) {
      try {
        beginLoading('Loading user...')
        setMission(await Mission.fetchOne(missionID!))
      } catch {
        handleError('Failed to load mission.')
      }
    }

    // Finish loading.
    finishLoading()
    // Update existsInDatabase state.
    setExistsInDatabase(existsInDatabase)
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

  if (mission !== null) {
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
        selectedNode.destroyNodeCreators()
      }

      forceUpdate()
    }

    // This will select or unselect a node
    const selectNode = (node: MissionNode | null) => {
      if (selectedNode !== null) {
        selectedNode.destroyNodeCreators()
      }

      setSelectedNode(node)
      setDisplayedAction(0)
      activateNodeStructuring(false)
      setMissionEmptyStringArray([])
      setNodeEmptyStringArray([])
      setActionEmptyStringArray([])
    }

    // This is called to save any changes
    // made.
    const save = (
      callback: () => void = () => {},
      callbackError: (error: Error) => void = () => {},
    ): void => {
      if (areUnsavedChanges) {
        setAreUnsavedChanges(false)

        if (!existsInDatabase) {
          createMission(
            mission,
            true,
            (resultingMission: Mission) => {
              notify('Mission successfully saved.')
              setMission(resultingMission)
              setExistsInDatabase(true)
              callback()
            },
            (error: Error) => {
              notify('Mission failed to save')
              setAreUnsavedChanges(true)
              callbackError(error)
            },
          )
        } else {
          saveMission(
            mission,
            () => {
              notify('Mission successfully saved.')
              callback()
            },
            (error: Error) => {
              notify('Mission failed to save.')
              setAreUnsavedChanges(true)
              callbackError(error)
            },
          )
        }
      }
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
        selectedNode.actions.length === 0
      ) {
        // Checks to make sure the selected node has at least
        // one action to choose from. If the selected node doesn't
        // have at least one action then it will auto-generate one
        // for that node.
        let newActionArray: Array<MissionNodeAction> = [
          MissionNode.createDefaultAction(selectedNode),
        ]
        selectedNode.actions = newActionArray

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

    // requested to be added.
    const handleNodeAddRequest = (): void => {
      if (selectedNode !== null) {
        selectedNode.generateNodeCreators()
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
          (concludeAction: () => void) => {
            save(
              () => {
                goToPage('HomePage', {})
                concludeAction()
              },
              () => {
                concludeAction()
              },
            )
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
          (concludeAction: () => void) => {
            save(
              () => {
                goToPage('GamePage', {
                  missionID: mission.missionID,
                })
                concludeAction()
              },
              () => {
                concludeAction()
              },
            )
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
                  handleNodeSelection={(node: MissionNode) => {
                    validateNodeSelectionChange(() => {
                      selectNode(node)
                      ensureOneActionExistsIfExecutable()
                    })
                  }}
                  handleNodeCreation={(node: MissionNode) => {
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
                  applyNodeClassName={(node: MissionNode) => ''}
                  renderNodeTooltipDescription={(node: MissionNode) => ''}
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
  } else {
    return null
  }
}
