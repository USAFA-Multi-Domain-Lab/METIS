import { useBeforeunload } from 'react-beforeunload'
import { useEffect, useState } from 'react'
import {
  createMission,
  getMission,
  getMissionNodeColorOptions,
  Mission,
  saveMission,
} from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import MissionMap from '../content/game/MissionMap'
import './MissionFormPage.scss'
import { IPage } from '../App'
import { ENodeDeleteMethod, MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import MissionEntry from '../content/edit-mission/MissionEntry'
import NodeEntry from '../content/edit-mission/NodeEntry'
import NodeStructuring from '../content/edit-mission/NodeStructuring'
import { restrictedAccessRoles } from '../../modules/users'

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
  /* -- GLOBAL VARIABLES -- */
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>()
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

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (
      appState.currentUser &&
      appState.currentUser.role &&
      !restrictedAccessRoles.includes(appState.currentUser.role)
    ) {
      appActions.goToPage('HomePage', {})
      appActions.notify('Mission form page is not accessible to students.')
    } else {
      getMissionNodeColorOptions((colorOptions: Array<string>) => {
        appState.setMissionNodeColors(colorOptions)
      })
    }

    if (!mountHandled) {
      getMissionNodeColorOptions((colorOptions: Array<string>) => {
        appState.setMissionNodeColors(colorOptions)
      })

      let existsInDatabase: boolean
      let missionID: string | null = props.missionID

      // Creating a new mission.
      if (missionID === null) {
        let mission = new Mission(
          '',
          'New Mission',
          'Enter your overview message here.',
          1,
          false,
          5,
          {},
          [],
          '',
        )
        existsInDatabase = false
        setMission(mission)
        setAreUnsavedChanges(true)
        setMountHandled(true)
      }
      // Editing an existing mission.
      else {
        appActions.beginLoading('Loading mission...')

        getMission(
          missionID,
          (mission: Mission) => {
            setMission(mission)
            appActions.finishLoading()
          },
          () => {
            appActions.finishLoading()
            appActions.handleServerError('Failed to load mission.')
          },
          { expandAllNodes: true },
        )
        existsInDatabase = true
        setExistsInDatabase(existsInDatabase)
        setMountHandled(true)
      }
    }
  }, [mountHandled])

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
              appActions.notify('Mission successfully saved.')
              setMission(resultingMission)
              setExistsInDatabase(true)
              callback()
            },
            (error: Error) => {
              appActions.notify('Mission failed to save')
              setAreUnsavedChanges(true)
              callbackError(error)
            },
          )
        } else {
          saveMission(
            mission,
            () => {
              appActions.notify('Mission successfully saved.')
              callback()
            },
            (error: Error) => {
              appActions.notify('Mission failed to save.')
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
        appActions.notify(
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

        appActions.notify(
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
          appActions.confirm(
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
          appActions.confirm(
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
        appActions.notify(
          `**Error:** The mission side panel has at least one field that was left empty. This field must contain at least one character.`,
          { duration: null, errorMessage: true },
        )
        return onInvalid()
      }
      if (
        selectedNode !== null &&
        (nodeEmptyStringArray.length > 0 || actionEmptyStringArray.length > 0)
      ) {
        appActions.notify(
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
        appActions.goToPage('HomePage', {})
      } else {
        appActions.confirm(
          'You have unsaved changes. What do you want to do with them?',
          (concludeAction: () => void) => {
            save(
              () => {
                appActions.goToPage('HomePage', {})
                concludeAction()
              },
              () => {
                concludeAction()
              },
            )
          },
          {
            handleAlternate: (concludeAction: () => void) => {
              appActions.goToPage('HomePage', {})
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

    // This will logout the current user.
    const logout = () =>
      appActions.logout({
        returningPagePath: 'HomePage',
        returningPageProps: {},
      })

    // This will redirect the user to the
    // game page.
    const goToGamePage = (): void => {
      if (!areUnsavedChanges) {
        appActions.goToPage('GamePage', {
          missionID: mission.missionID,
        })
      } else {
        appActions.confirm(
          'You have unsaved changes. What do you want to do with them?',
          (concludeAction: () => void) => {
            save(
              () => {
                appActions.goToPage('GamePage', {
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
              appActions.goToPage('GamePage', {
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
      for (let notification of appState.notifications) {
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
              handleClick: logout,
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
                      appActions={appActions}
                      missionEmptyStringArray={missionEmptyStringArray}
                      setMissionEmptyStringArray={setMissionEmptyStringArray}
                      handleChange={handleChange}
                    />
                  )
                } else if (selectedNode !== null) {
                  return (
                    <NodeEntry
                      node={selectedNode}
                      appActions={appActions}
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
