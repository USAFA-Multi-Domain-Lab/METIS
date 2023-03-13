import { useBeforeunload } from 'react-beforeunload'
import React, { useEffect, useState } from 'react'
import {
  createMission,
  getMission,
  Mission,
  saveMission,
} from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import {
  Detail,
  DetailBox,
  DetailNumber,
  DetailDropDown,
  DetailToggle,
} from '../content/form/Form'
import MissionMap from '../content/game/MissionMap'
import Tooltip from '../content/communication/Tooltip'
import './MissionFormPage.scss'
import {
  ButtonSVG,
  EButtonSVGPurpose,
} from '../content/user-controls/ButtonSVG'
import MoreInformation from '../content/communication/MoreInformation'
import { IPage } from '../App'
import {
  ENodeDeleteMethod,
  ENodeTargetRelation,
  MissionNode,
} from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { EToggleLockState } from '../content/user-controls/Toggle'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import { Asset, getAllAssets } from '../../modules/assets'
import { Mechanism } from '../../modules/mechanisms'
import { MechanismState } from '../../modules/mechanism-state'
import { useStore } from 'react-context-hook'

// This is a enum used to describe
// the locations that one node can
// be dragged and dropped on another
// node, whether that's the top, center,
// or bottom of the drop zone.
enum ENodeDropLocation {
  Top,
  Center,
  Bottom,
}

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
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>()
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [mission, setMission] = useState<Mission | null>(null)
  const [assets, setAssets] = useState<Array<Asset>>([])
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
    if (appState.currentUser === null) {
      appActions.goToPage('MissionSelectionPage', {})
      appActions.notify('Mission form page is not accessible to students.')
    }

    if (!mountHandled) {
      let existsInDatabase: boolean
      let missionID: string | null = props.missionID

      // Creating a new mission.
      if (missionID === null) {
        let mission = new Mission('', 'New Mission', 1, false, 5, {}, [], '')
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

        appActions.beginLoading('Loading assets...')
        // Grabs all the assets from the database
        getAllAssets(
          (assets: Array<Asset>) => {
            setAssets(assets)
            appActions.finishLoading()
            setMountHandled(true)
          },
          (error: Error) => {
            appActions.handleServerError('Failed to retrieve assets...')
            appActions.finishLoading()
          },
        )
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
          { duration: null },
        )
        return onInvalid()
      }
      if (
        selectedNode !== null &&
        (nodeEmptyStringArray.length > 0 || actionEmptyStringArray.length > 0)
      ) {
        appActions.notify(
          `**Error:** The node called "${selectedNode.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
          { duration: null },
        )
        return onInvalid()
      }

      return onValid()
    }

    // This will logout the current user.
    const logout = () =>
      appActions.logout({
        returningPagePath: 'GamePage',
        returningPageProps: {
          missionID: mission.missionID,
        },
      })

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

    return (
      <div className={'MissionFormPage Page'}>
        {
          // -- navigation --
        }
        <Navigation
          links={[
            {
              text: 'Done',
              handleClick: () => {
                if (!areUnsavedChanges) {
                  appActions.goToPage('MissionSelectionPage', {})
                } else {
                  appActions.confirm(
                    'You have unsaved changes. What do you want to do with them?',
                    (concludeAction: () => void) => {
                      save(
                        () => {
                          appActions.goToPage('MissionSelectionPage', {})
                          concludeAction()
                        },
                        () => {
                          concludeAction()
                        },
                      )
                    },
                    {
                      handleAlternate: (concludeAction: () => void) => {
                        appActions.goToPage('MissionSelectionPage', {})
                        concludeAction()
                      },
                      pendingMessageUponConfirm: 'Saving...',
                      pendingMessageUponAlternate: 'Discarding...',
                      buttonConfirmText: 'Save',
                      buttonAlternateText: 'Discard',
                    },
                  )
                }
              },
              visible: true,
              key: 'done',
            },
            {
              text: 'Play test',
              handleClick: () => {
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
              },
              visible: true,
              key: 'play-test',
            },
            {
              text: 'Log out',
              handleClick: logout,
              visible: true,
              key: 'logout',
            },
          ]}
          brandingCallback={() => {
            if (!areUnsavedChanges) {
              appActions.goToPage('MissionSelectionPage', {})
            } else {
              appActions.confirm(
                'You have unsaved changes. What do you want to do with them?',
                (concludeAction: () => void) => {
                  save(
                    () => {
                      appActions.goToPage('MissionSelectionPage', {})
                      concludeAction()
                    },
                    () => {
                      concludeAction()
                    },
                  )
                },
                {
                  handleAlternate: (concludeAction: () => void) => {
                    appActions.goToPage('MissionSelectionPage', {})
                    concludeAction()
                  },
                  pendingMessageUponConfirm: 'Saving...',
                  pendingMessageUponAlternate: 'Discarding...',
                  buttonConfirmText: 'Save',
                  buttonAlternateText: 'Discard',
                },
              )
            }
          }}
          brandingTooltipDescription='Go home.'
        />
        {
          // -- content --
        }
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
                    <MissionDetails
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
                      assets={assets}
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
      </div>
    )
  } else {
    return null
  }
}

// This will render the basic editable
// details of the mission itself.
function MissionDetails(props: {
  active: boolean
  mission: Mission
  missionEmptyStringArray: Array<string>
  setMissionEmptyStringArray: (missionEmptyString: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let mission: Mission = props.mission
  let missionEmptyStringArray: Array<string> = props.missionEmptyStringArray
  let setMissionEmptyStringArray: (missionEmptyString: Array<string>) => void =
    props.setMissionEmptyStringArray
  let handleChange = props.handleChange

  /* -- COMPONENT FUNCTIONS -- */
  const removeMissionEmptyString = (field: string) => {
    missionEmptyStringArray.map((missionEmptyString: string, index: number) => {
      if (
        missionEmptyString === `missionID=${mission.missionID}_field=${field}`
      ) {
        missionEmptyStringArray.splice(index, 1)
      }
    })
  }

  if (active) {
    return (
      <div className='MissionDetails SidePanel'>
        <div className='BorderBox'>
          <div className='BoxTop'>
            <div className='ErrorMessage Hidden'></div>
          </div>
          <div className='SidePanelSection MainDetails'>
            <Detail
              label='Name'
              initialValue={mission.name}
              deliverValue={(name: string) => {
                if (name !== '') {
                  mission.name = name
                  removeMissionEmptyString('name')
                  handleChange()
                } else {
                  setMissionEmptyStringArray([
                    ...missionEmptyStringArray,
                    `missionID=${mission.missionID}_field=name`,
                  ])
                }
              }}
              key={`${mission.missionID}_name`}
            />
            <DetailToggle
              label={'Live'}
              initialValue={mission.live}
              deliverValue={(live: boolean) => {
                mission.live = live
                handleChange()
              }}
            />
            <DetailNumber
              label='Initial Resources'
              initialValue={mission.initialResources}
              deliverValue={(initialResources: number | null) => {
                if (initialResources !== null) {
                  mission.initialResources = initialResources
                  handleChange()
                }
              }}
              key={`${mission.missionID}_initialResources`}
            />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

// This will render a form where
// a given node can be edited.
function NodeEntry(props: {
  node: MissionNode | null
  assets: Array<Asset>
  appActions: AppActions
  displayedAction: number
  setDisplayedAction: (displayedAction: number) => void
  nodeEmptyStringArray: Array<string>
  setNodeEmptyStringArray: (nodeEmptyStringArray: Array<string>) => void
  actionEmptyStringArray: Array<string>
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  handleChange: () => void
  handleAddRequest: () => void
  handleDeleteRequest: () => void
  handleCloseRequest: () => void
}): JSX.Element | null {
  let node: MissionNode | null = props.node
  let assets: Array<Asset> = props.assets
  let appActions: AppActions = props.appActions
  let displayedAction: number = props.displayedAction
  let setDisplayedAction: (displayedAction: number) => void =
    props.setDisplayedAction
  let nodeEmptyStringArray: Array<string> = props.nodeEmptyStringArray
  let setNodeEmptyStringArray = props.setNodeEmptyStringArray
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setActionEmptyStringArray: (
    actionEmptyStringArray: Array<string>,
  ) => void = props.setActionEmptyStringArray
  let isEmptyString: boolean =
    nodeEmptyStringArray.length > 0 || actionEmptyStringArray.length > 0
  let handleChange = props.handleChange
  let handleAddNodeRequest = props.handleAddRequest
  let handleDeleteRequest = props.handleDeleteRequest
  let handleCloseRequest = props.handleCloseRequest
  let boxTopClassName: string = 'BoxTop'
  let closeClassName: string = 'Close'
  let toggleErrorMessage: string | undefined = undefined
  let deleteNodeClassName: string = 'FormButton DeleteNode'
  let addNodeClassName: string = 'FormButton AddNode'

  /* -- COMPONENT STATE -- */
  const [mountHandled, setMountHandled] = useState<boolean>()

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- COMPONENT FUNCTIONS -- */

  const removeNodeEmptyString = (field: string) => {
    nodeEmptyStringArray.map((nodeEmptyString: string, index: number) => {
      if (
        node !== null &&
        nodeEmptyString === `nodeID=${node.nodeID}_field=${field}`
      ) {
        nodeEmptyStringArray.splice(index, 1)
      }
    })
  }

  /* -- RENDER -- */

  if (node !== null) {
    let mission: Mission = node.mission

    if (isEmptyString) {
      closeClassName += ' Disabled'
      toggleErrorMessage =
        'The button above is locked until there are no empty fields.'
      boxTopClassName += ' IsError'
    }

    if (mission.nodes.size < 2) {
      deleteNodeClassName += ' Disabled'
    }
    if (isEmptyString) {
      addNodeClassName += ' Disabled'
    }

    return (
      <div className='NodeEntry SidePanel'>
        <div className='BorderBox'>
          <div className={boxTopClassName}>
            <div className='ErrorMessage'>
              Fix all errors before closing panel.
            </div>
            <div
              className={closeClassName}
              onClick={() => {
                if (!isEmptyString) {
                  handleCloseRequest()
                } else if (node !== null) {
                  appActions.notify(
                    `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
                    { duration: null },
                  )
                }
                setMountHandled(false)
              }}
              key={'close-node-side-panel'}
            >
              <div className='Circle'>
                <div className='X'>x</div>
              </div>
              <Tooltip description='Close panel.' />
            </div>
          </div>
          <div className='SidePanelSection'>
            <Detail
              label='Name'
              initialValue={node.name}
              deliverValue={(name: string) => {
                if (node !== null && name !== '') {
                  node.name = name
                  removeNodeEmptyString('name')
                  setMountHandled(false)
                  handleChange()
                } else if (node !== null) {
                  setNodeEmptyStringArray([
                    ...nodeEmptyStringArray,
                    `nodeID=${node.nodeID}_field=name`,
                  ])
                  setMountHandled(false)
                }
              }}
              key={`${node.nodeID}_name`}
            />
            <DetailDropDown<string>
              label={'Color'}
              options={[
                'default',
                'green',
                'pink',
                'yellow',
                'blue',
                'purple',
                'red',
                'brown',
                'orange',
              ]}
              currentValue={node.color}
              uniqueClassName={'Color'}
              renderDisplayName={(color) => color}
              deliverValue={(color: string) => {
                if (node !== null) {
                  node.color = color

                  handleChange()
                }
              }}
              key={`${node.nodeID}_color`}
            />
            <div className='ButtonContainer'>
              <div
                className='ColorFill Detail FormButton'
                onClick={() => {
                  if (node !== null) {
                    node.applyColorFill()
                    handleChange()
                  }
                }}
              >
                <span className='Text'>
                  <span className='LeftBracket'>[</span> Fill{' '}
                  <span className='RightBracket'>]</span>
                  <Tooltip description='Shade all descendant nodes this color as well.' />
                </span>
              </div>
            </div>
            <DetailBox
              label='Description'
              initialValue={node.description}
              deliverValue={(description: string) => {
                if (
                  node !== null &&
                  description !== '' &&
                  description !== null
                ) {
                  node.description = description
                  removeNodeEmptyString('description')
                  setMountHandled(false)
                  handleChange()
                } else if (node !== null) {
                  setNodeEmptyStringArray([
                    ...nodeEmptyStringArray,
                    `nodeID=${node.nodeID}_field=description`,
                  ])
                  setMountHandled(false)
                }
              }}
              key={`${node.nodeID}_description`}
            />
            <DetailBox
              label='Pre-Execution Text (optional)'
              initialValue={node.preExecutionText}
              emptyStringAllowed={true}
              deliverValue={(preExecutionText: string) => {
                if (node !== null) {
                  node.preExecutionText = preExecutionText
                  handleChange()
                }
              }}
              key={`${node.nodeID}_preExecutionText`}
            />
            <DetailNumber
              label='Depth Padding'
              initialValue={node.depthPadding}
              deliverValue={(depthPadding: number | null) => {
                if (node !== null && depthPadding !== null) {
                  node.depthPadding = depthPadding
                  handleChange()
                }
              }}
              key={`${node.nodeID}_depthPadding`}
            />
            <DetailToggle
              label={'Executable'}
              initialValue={node.executable}
              errorMessage={
                'The button above is locked until there are no empty fields.'
              }
              deliverValue={(executable: boolean) => {
                if (node !== null) {
                  node.executable = executable

                  if (executable && node.actions.length === 0) {
                    // Checks to make sure the selected node has at least one action to choose from. If the selected node does not have at least one action then it will auto-generate one for that node.
                    let newActionArray: Array<MissionNodeAction> = [
                      MissionNode.createDefaultAction(node),
                    ]
                    node.actions = newActionArray

                    appActions.notify(
                      `Auto-generated an action for ${node.name} because it is an executable node with no actions to execute.`,
                      { duration: 10000 },
                    )
                  }
                }

                handleChange()
              }}
              lockState={
                !isEmptyString
                  ? EToggleLockState.Unlocked
                  : isEmptyString && node.executable
                  ? EToggleLockState.LockedActivation
                  : isEmptyString && !node.executable
                  ? EToggleLockState.LockedDeactivation
                  : EToggleLockState.Unlocked
              }
              key={`${node.nodeID}_executable`}
            />
            <DetailToggle
              label={'Device'}
              initialValue={node.device}
              errorMessage={toggleErrorMessage}
              lockState={
                !isEmptyString && node.executable
                  ? EToggleLockState.Unlocked
                  : isEmptyString && node.executable && node.device
                  ? EToggleLockState.LockedActivation
                  : isEmptyString && node.executable && !node.device
                  ? EToggleLockState.LockedDeactivation
                  : EToggleLockState.LockedDeactivation
              }
              deliverValue={(device: boolean) => {
                if (node !== null) {
                  node.device = device
                  handleChange()
                }
              }}
              key={`${node.nodeID}_device`}
            />
            <div className='ButtonContainer'>
              <div className={addNodeClassName}>
                <span className='Text' onClick={handleAddNodeRequest}>
                  <span className='LeftBracket'>[</span> Add adjacent node{' '}
                  <span className='RightBracket'>]</span>
                  <Tooltip description='Add one or multiple nodes adjacent to this node.' />
                </span>
              </div>
              <div className={deleteNodeClassName}>
                <span className='Text' onClick={handleDeleteRequest}>
                  <span className='LeftBracket'>[</span> Delete node{' '}
                  <span className='RightBracket'>]</span>
                  <Tooltip description='Delete this node.' />
                </span>
              </div>
            </div>
          </div>
          <NodeActions
            node={node}
            assets={assets}
            appActions={appActions}
            isEmptyString={isEmptyString}
            displayedAction={displayedAction}
            setDisplayedAction={setDisplayedAction}
            setMountHandled={setMountHandled}
            actionEmptyStringArray={actionEmptyStringArray}
            setActionEmptyStringArray={setActionEmptyStringArray}
            handleChange={handleChange}
          />
        </div>
      </div>
    )
  } else {
    return null
  }
}

function NodeActions(props: {
  node: MissionNode
  assets: Array<Asset>
  appActions: AppActions
  isEmptyString: boolean
  displayedAction: number
  setDisplayedAction: (displayedAction: number) => void
  setMountHandled: (mountHandled: boolean) => void
  actionEmptyStringArray: Array<string>
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let node: MissionNode = props.node
  let assets: Array<Asset> = props.assets
  let appActions: AppActions = props.appActions
  let isEmptyString: boolean = props.isEmptyString
  let displayedAction: number = props.displayedAction
  let setDisplayedAction: (displayedAction: number) => void =
    props.setDisplayedAction
  let setMountHandled: (mountHandled: boolean) => void = props.setMountHandled
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setActionEmptyStringArray: (
    actionEmptyStringArray: Array<string>,
  ) => void = props.setActionEmptyStringArray
  let handleChange = props.handleChange
  let totalActions: number | undefined = node.actions.length
  let actionKey: string = ''
  let addNewActionClassName: string = 'Action add'
  let selectorContainerClassName: string = 'SelectorContainer'

  /* -- COMPONENT FUNCTIONS -- */

  const displayNextAction = () => {
    if (node.actions !== undefined) {
      let lastAction: number = node.actions.length - 1

      if (!isEmptyString) {
        if (displayedAction === lastAction) {
          setDisplayedAction(0)
          setMountHandled(false)
        } else {
          setDisplayedAction(displayedAction + 1)
          setMountHandled(false)
        }
        setActionEmptyStringArray([])
      } else {
        appActions.notify(
          `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
          { duration: null },
        )
      }
    }
  }

  const displayPreviousAction = () => {
    if (!isEmptyString) {
      if (displayedAction === 0 && node.actions !== undefined) {
        setDisplayedAction(node.actions.length - 1)
      } else {
        setDisplayedAction(displayedAction - 1)
      }
      setActionEmptyStringArray([])
    } else {
      appActions.notify(
        `**Error:** The node called "${node.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
        { duration: null },
      )
    }
  }

  /* -- RENDER -- */

  // Logic that hides the buttons that select which action is being
  // displayed because there is 1 action or less for the selected node.
  if (
    node.actions.length === 0 ||
    node.actions.length === 1 ||
    node.actions[0] === undefined
  ) {
    actionKey = 'no_action_id_to_choose_from'
    selectorContainerClassName += ' Hidden'
  }

  // Logic that keeps the app from crashing by making the key for the
  // individual action that is being displayed under the action(s) section
  // change dynamically.
  if (node.actions.length > 0) {
    actionKey = node.actions[displayedAction].actionID
  } else if (node.actions.length <= 0) {
    actionKey = 'no_action_id_to_choose_from'
  }

  if (node.executable) {
    return (
      <>
        <div className='NodeActionDetails SidePanelSection'>
          <h4 className='ActionInfo'>Action(s):</h4>
          <div className={selectorContainerClassName}>
            <div className='Previous' onClick={displayPreviousAction}>
              previous
            </div>
            <div className='CurrentActionDisplayed'>
              {displayedAction + 1}/{totalActions}
            </div>
            <div className='Next' onClick={displayNextAction}>
              next
            </div>
          </div>
          <NodeAction
            action={node.actions[displayedAction]}
            assets={assets}
            appActions={appActions}
            displayedAction={displayedAction}
            setDisplayedAction={setDisplayedAction}
            actionEmptyStringArray={actionEmptyStringArray}
            setActionEmptyStringArray={setActionEmptyStringArray}
            setMountHandled={setMountHandled}
            handleChange={handleChange}
            key={actionKey}
          />
          <div className={selectorContainerClassName}>
            <div className='Previous' onClick={displayPreviousAction}>
              previous
            </div>
            <div className='CurrentActionDisplayed'>
              {displayedAction + 1}/{totalActions}
            </div>
            <div className='Next' onClick={displayNextAction}>
              next
            </div>
          </div>
        </div>
        <div className='UserActions SidePanelSection'>
          <ButtonSVG
            purpose={EButtonSVGPurpose.Add}
            handleClick={() => {
              if (node !== null) {
                let action: MissionNodeAction =
                  MissionNode.createDefaultAction(node)
                node.actions.push(action)
                handleChange()
              }
            }}
            tooltipDescription={'Add a new action to this node.'}
            uniqueClassName={addNewActionClassName}
            // key={`actual-action_add-new-action_${node.nodeID}`}
          />
        </div>
      </>
    )
  } else {
    return null
  }
}

// This will render an action
// available to a node.
function NodeAction(props: {
  action: MissionNodeAction
  assets: Array<Asset>
  appActions: AppActions
  handleChange: () => void
  displayedAction: number
  setDisplayedAction: (displayedAction: number) => void
  actionEmptyStringArray: Array<string>
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  setMountHandled: (mountHandled: boolean) => void
}): JSX.Element | null {
  let action: MissionNodeAction = props.action
  let node: MissionNode = action.node
  let assets: Array<Asset> = props.assets
  let appActions: AppActions = props.appActions
  let handleChange: () => void = props.handleChange
  let displayedAction: number = props.displayedAction
  let setDisplayedAction: (displayedAction: number) => void =
    props.setDisplayedAction
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setActionEmptyStringArray: (
    actionEmptyStringArray: Array<string>,
  ) => void = props.setActionEmptyStringArray
  let setMountHandled: (mountHandled: boolean) => void = props.setMountHandled
  let deleteActionClassName: string = 'FormButton DeleteAction'

  /* -- COMPONENT FUNCTIONS -- */
  const removeActionEmptyString = (field: string) => {
    actionEmptyStringArray.map((actionEmptyString: string, index: number) => {
      if (actionEmptyString === `actionID=${action.actionID}_field=${field}`) {
        actionEmptyStringArray.splice(index, 1)
      }
    })
  }

  const handleDeleteRequest = () => {
    if (action === node.actions[0]) {
      node.actions.shift()
      setDisplayedAction(0)
    } else if (node.actions.length > 1) {
      node.actions.splice(node.actions.indexOf(action), 1)
      setDisplayedAction(displayedAction - 1)
    }

    setActionEmptyStringArray([])
    handleChange()
  }

  /* -- RENDER -- */

  if (node.actions.length === 1) {
    deleteActionClassName += ' Disabled'
  }

  if (node.executable) {
    return (
      <div className='NodeAction'>
        <Detail
          label='Name'
          initialValue={action.name}
          deliverValue={(name: string) => {
            if (name !== '') {
              action.name = name
              removeActionEmptyString('name')
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=name`,
              ])
              setMountHandled(false)
            }
          }}
          key={`${action.actionID}_name`}
        />
        <DetailBox
          label='Description'
          initialValue={action.description}
          appActions={appActions}
          selectedNode={node}
          deliverValue={(description: string) => {
            if (description !== '') {
              action.description = description
              removeActionEmptyString('description')
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=description`,
              ])
              setMountHandled(false)
            }
          }}
          key={`${action.actionID}_description`}
        />
        <DetailNumber
          label='Success Chance'
          initialValue={parseFloat(
            `${(action.successChance * 100.0).toFixed(2)}`,
          )}
          minimum={0}
          maximum={100}
          unit='%'
          deliverValue={(successChancePercentage: number | null) => {
            if (successChancePercentage !== null) {
              action.successChance = successChancePercentage / 100.0

              handleChange()
            }
          }}
          key={`${action.actionID}_successChance`}
        />
        <DetailNumber
          label='Process Time'
          initialValue={action.processTime / 1000}
          minimum={0}
          maximum={3600}
          unit='s'
          deliverValue={(timeCost: number | null) => {
            if (timeCost !== null) {
              action.processTime = timeCost * 1000

              handleChange()
            }
          }}
          key={`${action.actionID}_timeCost`}
        />
        <DetailNumber
          label='Resource Cost'
          initialValue={action.resourceCost}
          deliverValue={(resourceCost: number | null) => {
            if (resourceCost !== null) {
              action.resourceCost = resourceCost

              handleChange()
            }
          }}
          key={`${action.actionID}_resourceCost`}
        />
        <DetailBox
          label='Post-Execution Success Text'
          initialValue={action.postExecutionSuccessText}
          appActions={appActions}
          selectedNode={node}
          deliverValue={(postExecutionSuccessText: string) => {
            if (postExecutionSuccessText !== '') {
              action.postExecutionSuccessText = postExecutionSuccessText
              removeActionEmptyString('postExecutionSuccessText')
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionSuccessText`,
              ])
              setMountHandled(false)
            }
          }}
          key={`${action.actionID}_postExecutionSuccessText`}
        />
        <DetailBox
          label='Post-Execution Failure Text'
          initialValue={action.postExecutionFailureText}
          appActions={appActions}
          selectedNode={node}
          deliverValue={(postExecutionFailureText: string) => {
            if (postExecutionFailureText !== '') {
              action.postExecutionFailureText = postExecutionFailureText
              removeActionEmptyString('postExecutionFailureText')
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionFailureText`,
              ])
              setMountHandled(false)
            }
          }}
          key={`${action.actionID}_postExecutionFailureText`}
        />
        <NodeActionAssets
          action={action}
          assets={assets}
          handleChange={handleChange}
        />
        <div className='ButtonContainer'>
          <div
            className={deleteActionClassName}
            key={`${action.actionID}_delete`}
          >
            <span className='Text' onClick={handleDeleteRequest}>
              <span className='LeftBracket'>[</span> Delete Action{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Delete this action from the node.' />
            </span>
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

// This will render the list of assets
// that the user previously selected
function NodeActionAssets(props: {
  action: MissionNodeAction
  assets: Array<Asset>
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let assets: Array<Asset> = props.assets
  let handleChange = props.handleChange
  let addAssetClassName: string = 'FormButton AddAsset'
  let cancelAssetClassName: string = 'Hidden'

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- COMPONENT FUNCTIONS -- */
  const removeAsset = (mechanismStateID: string) => {
    action.mechanismStateIDs.splice(
      action.mechanismStateIDs.indexOf(mechanismStateID),
      1,
    )
    handleChange()
  }

  // This allows the user to add an asset to the
  // affected asset list.
  const addAsset = () => {
    action.addAssetButtonIsDisplayed = false
    action.cancelAssetButtonIsDisplayed = true
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // This allows the user to be able to cancel adding
  // an asset to the affected asset list.
  const cancelAsset = () => {
    action.addAssetButtonIsDisplayed = true
    action.cancelAssetButtonIsDisplayed = false

    if (action.selectedAsset && action.selectedAsset.selectedMechanism) {
      action.selectedAsset.selectedMechanism.selectedState = null
    }
    if (action.selectedAsset) {
      action.selectedAsset.selectedMechanism = null
    }
    action.selectedAsset = null
  }

  /* -- RENDER -- */

  // Logic to hide the add asset button and
  // display the cancel button
  if (!action.addAssetButtonIsDisplayed) {
    addAssetClassName += ' Hidden'
    cancelAssetClassName = 'FormButton'
  }

  // Logic to hide the cancel button
  if (!action.cancelAssetButtonIsDisplayed) {
    cancelAssetClassName += ' Hidden'
  }

  if (action.mechanismStateIDs.length > 0) {
    return (
      <div className='Assets'>
        <h5 className='AssetInfo'>Asset(s):</h5>
        <div className='AssetListTitle'>Assets that will be affected:</div>
        <div className='SelectedAssetListContainer'>
          {action.mechanismStateIDs.map(
            (mechanismStateID: string, index: number) => {
              return (
                <div
                  className='SelectedAssetList'
                  key={`action-${action.actionID}_SelectedAssetList-${index}`}
                >
                  <div
                    className='SelectedAsset'
                    key={`action-${action.actionID}_mechanismState-${mechanismStateID}`}
                  >
                    {mechanismStateID}{' '}
                  </div>
                  <div
                    className='RemoveAssetButton'
                    onClick={() => removeAsset(mechanismStateID)}
                    key={`action-${action.actionID}_mechanismState-${mechanismStateID}_remove`}
                  >
                    x
                  </div>
                </div>
              )
            },
          )}
        </div>

        <NodeActionAsset
          action={action}
          assets={assets}
          handleChange={handleChange}
        />

        <div className='ButtonContainer'>
          <div
            className={addAssetClassName}
            key={`${action.actionID}_addAsset`}
          >
            <span className='Text' onClick={() => addAsset()}>
              <span className='LeftBracket'>[</span> Add Asset{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Add an asset that the action will affect upon successful execution.' />
            </span>
          </div>

          <div
            className={cancelAssetClassName}
            key={`${action.actionID}_cancelAsset`}
          >
            <span className='Text' onClick={() => cancelAsset()}>
              <span className='LeftBracket'>[</span> Cancel{' '}
              <span className='RightBracket'>]</span>
            </span>
          </div>
        </div>
      </div>
    )
  } else if (action.mechanismStateIDs.length === 0) {
    return (
      <div className='Assets'>
        <NodeActionAsset
          action={action}
          assets={assets}
          handleChange={handleChange}
        />
        <div className='ButtonContainer'>
          <div
            className={addAssetClassName}
            key={`${action.actionID}_addAsset`}
          >
            <span className='Text' onClick={() => addAsset()}>
              <span className='LeftBracket'>[</span> Add Asset{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Add an asset that the action will affect upon successful execution.' />
            </span>
          </div>

          <div
            className={cancelAssetClassName}
            key={`${action.actionID}_cancelAsset`}
          >
            <span className='Text' onClick={() => cancelAsset()}>
              <span className='LeftBracket'>[</span> Cancel{' '}
              <span className='RightBracket'>]</span>
            </span>
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

// This will render an asset
// drop down to a action.
function NodeActionAsset(props: {
  action: MissionNodeAction
  assets: Array<Asset>
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let assets: Array<Asset> = props.assets
  let handleChange = props.handleChange

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- RENDER -- */

  if (assets.length > 0 && !action.addAssetButtonIsDisplayed) {
    return (
      <div className='Asset'>
        <DetailDropDown<Asset>
          label={`Asset`}
          options={assets}
          currentValue={action.selectedAsset}
          renderDisplayName={(asset: Asset) => asset.name}
          deliverValue={(asset: Asset) => {
            action.selectedAsset = asset
            setForcedUpdateCounter(forcedUpdateCounter + 1)
          }}
          key={`action-${action.actionID}_asset`}
        />
        <AssetMechanism action={action} handleChange={handleChange} />
      </div>
    )
  } else {
    return null
  }
}

function AssetMechanism(props: {
  action: MissionNodeAction
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let handleChange = props.handleChange
  let currentMechanismOptions: Array<Mechanism> = []

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- RENDER -- */

  if (action.selectedAsset) {
    // Creates the list of mechanism options for
    // the user to select from
    currentMechanismOptions = action.selectedAsset.mechanisms

    return (
      <>
        <DetailDropDown<Mechanism>
          label='Asset Mechanism'
          options={currentMechanismOptions}
          currentValue={action.selectedAsset.selectedMechanism}
          renderDisplayName={(mechanism: Mechanism) => mechanism.name}
          deliverValue={(mechanism: Mechanism) => {
            if (action.selectedAsset) {
              action.selectedAsset.selectedMechanism = mechanism
              setForcedUpdateCounter(forcedUpdateCounter + 1)
            }
          }}
          key={`action-${action.actionID}_mechanism`}
        />
        <AssetMechanismMechanismState
          action={action}
          handleChange={handleChange}
        />
      </>
    )
  } else {
    return null
  }
}

function AssetMechanismMechanismState(props: {
  action: MissionNodeAction
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let handleChange = props.handleChange
  let currentMechanismStateOptions: Array<MechanismState> = []
  let submitAssetClassName: string = 'Hidden'

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- COMPONENT FUNCTIONS -- */

  // This adds the selected mechanismStateID to an
  // array stored in each action so that the user
  // can see it in the affected asset list.
  // Upon submission the drop-down lists are reset
  // to their default state, the add asset button
  // is displayed and the user is able to save the mission.
  const submitAsset = () => {
    if (
      action.selectedAsset &&
      action.selectedAsset.selectedMechanism &&
      action.selectedAsset.selectedMechanism.selectedState
    ) {
      action.mechanismStateIDs.push(
        action.selectedAsset.selectedMechanism.selectedState.mechanismStateID,
      )
    }
    action.addAssetButtonIsDisplayed = true
    handleChange()
    if (action.selectedAsset && action.selectedAsset.selectedMechanism) {
      action.selectedAsset.selectedMechanism.selectedState = null
    }
    if (action.selectedAsset) {
      action.selectedAsset.selectedMechanism = null
    }
    action.selectedAsset = null
  }

  /* -- RENDER -- */

  // Logic to hide/display the submit asset button
  if (
    !action.cancelAssetButtonIsDisplayed &&
    !action.addAssetButtonIsDisplayed
  ) {
    submitAssetClassName = 'FormButton'
  } else if (
    action.cancelAssetButtonIsDisplayed ||
    action.addAssetButtonIsDisplayed
  ) {
    submitAssetClassName += ' Hidden'
  }

  if (
    action.selectedAsset &&
    action.selectedAsset.selectedMechanism &&
    !action.addAssetButtonIsDisplayed
  ) {
    // Creates a list of mechanism-state options
    // for the user to select from
    currentMechanismStateOptions = action.selectedAsset.selectedMechanism.states

    return (
      <>
        <DetailDropDown<MechanismState>
          label='Mechanism State'
          options={currentMechanismStateOptions}
          currentValue={action.selectedAsset.selectedMechanism.selectedState}
          renderDisplayName={(mechanismState: MechanismState) =>
            mechanismState.name
          }
          deliverValue={(mechanismState: MechanismState) => {
            if (
              action.selectedAsset &&
              action.selectedAsset.selectedMechanism
            ) {
              action.selectedAsset.selectedMechanism.selectedState =
                mechanismState
            }
            action.cancelAssetButtonIsDisplayed = false
            setForcedUpdateCounter(forcedUpdateCounter + 1)
          }}
          key={`action-${action.actionID}_mechanismState`}
        />

        <div className='ButtonContainer'>
          <div
            className={submitAssetClassName}
            key={`${action.actionID}_submitAsset`}
          >
            <span className='Text' onClick={() => submitAsset()}>
              <span className='LeftBracket'>[</span> Submit Asset{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Submits asset to the list of assets that will be affected.' />
            </span>
          </div>
        </div>
      </>
    )
  } else {
    return null
  }
}

// This will render a form where
// the node structure for the mission
// can be defined.
function NodeStructuring(props: {
  active: boolean
  mission: Mission
  handleChange: () => void
  handleCloseRequest: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let mission: Mission = props.mission
  let handleChange = props.handleChange
  let handleCloseRequest = props.handleCloseRequest
  let rootNode: MissionNode = mission.rootNode

  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [nodeGrabbed, grabNode] = useState<MissionNode | null>(null)
  const [nodePendingDrop, pendDrop] = useState<MissionNode | null>(null)
  const [dropLocation, setDropLocation] = useState<ENodeDropLocation>(
    ENodeDropLocation.Center,
  )

  // Forces a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  const Padding = (props: { uniqueClassName?: string }): JSX.Element | null => {
    const [dropPendingHere, setDropPendingHere] = useState<boolean>(false)

    let uniqueClassName: string | undefined = props.uniqueClassName
    let className: string | undefined = 'Padding'

    // This will set this padding as
    // the currently hovered over drop
    // zone.
    const pendDropHere = (): void => {
      setDropPendingHere(true)
      pendDrop(rootNode)
    }

    // This will stop this padding from
    // being the currently hovered over
    // drop zone.
    const cancelDropHere = (): void => {
      if (nodePendingDrop !== null) {
        setDropPendingHere(false)
        pendDrop(null)
      }
    }

    if (uniqueClassName !== undefined) {
      className += ` ${uniqueClassName}`
    }

    if (dropPendingHere && rootNode.nodeID === nodePendingDrop?.nodeID) {
      className += ' DropPending'
    }

    return (
      <div
        className={className}
        draggable={true}
        onDragOver={(event: React.DragEvent) => {
          event.preventDefault()
        }}
        onDragEnter={pendDropHere}
        onDragLeave={cancelDropHere}
        onDrop={(event: React.DragEvent) => {
          if (nodePendingDrop !== null) {
            let destinationNode = nodePendingDrop

            if (nodeGrabbed !== null) {
              nodeGrabbed.move(
                destinationNode,
                ENodeTargetRelation.ChildOfTarget,
              )
              handleChange()
            }

            pendDrop(null)
            grabNode(null)
          }
        }}
      ></div>
    )
  }

  // This will render a node in the
  // structuring for the given node
  // name.
  const Node = (props: {
    node: MissionNode
    disableDropPending?: boolean
  }): JSX.Element | null => {
    let node: MissionNode = props.node
    let disableDropPending: boolean = props.disableDropPending === true

    /* -- COMPONENT FUNCTIONS -- */
    const handleClick = () => {
      node.toggleMenuExpansion()
      forceUpdate()
    }

    /* -- RENDER -- */
    let className: string = 'Node'
    let indicatorClassName: string = 'Indicator'

    className += node.hasChildren ? ' Expandable' : ' Ends'

    if (node.nodeID === nodeGrabbed?.nodeID) {
      disableDropPending = true
    }

    if (node.nodeID === nodePendingDrop?.nodeID) {
      className += ' DropPending'

      switch (dropLocation) {
        case ENodeDropLocation.Top:
          className += ' DropPendingTop'
          break
        case ENodeDropLocation.Center:
          className += ' DropPendingCenter'
          break
        case ENodeDropLocation.Bottom:
          className += ' DropPendingBottom'
          break
      }
    }

    if (node.collapsedInMenu) {
      indicatorClassName += ' isCollapsed'
    }

    return (
      <div className={className}>
        <div
          className='ParentNode'
          draggable={true}
          onDragCapture={() => {
            grabNode(node)
          }}
          onDrop={(event: React.DragEvent) => {
            if (nodePendingDrop !== null) {
              let target: MissionNode = nodePendingDrop
              let targetRelation: ENodeTargetRelation

              switch (dropLocation) {
                case ENodeDropLocation.Top:
                  targetRelation = ENodeTargetRelation.PreviousSiblingOfTarget
                  break
                case ENodeDropLocation.Center:
                  targetRelation = ENodeTargetRelation.ChildOfTarget
                  break
                case ENodeDropLocation.Bottom:
                  targetRelation = ENodeTargetRelation.FollowingSiblingOfTarget
                  break
                default:
                  targetRelation = ENodeTargetRelation.ChildOfTarget
                  break
              }

              if (nodeGrabbed !== null) {
                nodeGrabbed.move(target, targetRelation)
                if (target.hasChildren) {
                  target.open()
                }
                handleChange()
              }
              pendDrop(null)
              grabNode(null)
            }
          }}
        >
          <div
            className='Top'
            onDragOver={(event: React.DragEvent) => {
              event.preventDefault()
            }}
            onDragEnter={() => {
              if (
                node.nodeID !== nodePendingDrop?.nodeID &&
                !disableDropPending
              ) {
                pendDrop(node)
                setDropLocation(ENodeDropLocation.Top)
              }
            }}
            onDragLeave={() => {
              if (nodePendingDrop !== null) {
                pendDrop(null)
              }
            }}
          ></div>

          <div
            className='Center'
            onDragOver={(event: React.DragEvent) => {
              event.preventDefault()
            }}
            onDragEnter={() => {
              if (
                node.nodeID !== nodePendingDrop?.nodeID &&
                !disableDropPending
              ) {
                pendDrop(node)
                setDropLocation(ENodeDropLocation.Center)
              }
            }}
            onDragLeave={() => {
              if (nodePendingDrop !== null) {
                pendDrop(null)
              }
            }}
          >
            <svg className={indicatorClassName} onClick={handleClick}>
              <polygon
                points='3,7 10,7 6.5,14'
                className='Triangle'
                fill='#fff'
              />
            </svg>
            <div className='Name'>{node.name}</div>
          </div>
          <div
            className='Bottom'
            onDragOver={(event: React.DragEvent) => {
              event.preventDefault()
            }}
            onDragEnter={() => {
              if (
                node.nodeID !== nodePendingDrop?.nodeID &&
                !disableDropPending
              ) {
                pendDrop(node)
                setDropLocation(ENodeDropLocation.Bottom)
              }
            }}
            onDragLeave={() => {
              if (nodePendingDrop !== null) {
                pendDrop(null)
              }
            }}
          ></div>
        </div>
        {node.expandedInMenu ? (
          <div className='ChildNodes'>
            {node.childNodes.map((childNode: MissionNode) => (
              <Node
                node={childNode}
                disableDropPending={disableDropPending}
                key={childNode.nodeID}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  // This will render the nodes in the
  // node structuring.
  const renderNodes = (): JSX.Element | null => {
    let nodeElements: Array<JSX.Element | null> = rootNode.childNodes.map(
      (childNode: MissionNode) => (
        <Node node={childNode} key={childNode.nodeID} />
      ),
    )
    let className: string = 'Nodes'

    return (
      <div className={className}>
        <Padding uniqueClassName={'PaddingTop'} key={'PaddingTop'} />
        {nodeElements}
        <Padding uniqueClassName={'PaddingBottom'} key={'PaddingBottom'} />
      </div>
    )
  }

  if (active) {
    return (
      <div className='NodeStructuring SidePanel'>
        <div className='BorderBox'>
          <div className='BoxTop'>
            <div className='ErrorMessage Hidden'></div>
            <MoreInformation
              tooltipDescription={
                '##### Node Structuring\n' +
                'Drag and drop the nodes below to reorder the structure of the mission. Nodes can be placed inside another node to nest nodes. Nodes can also be placed beside each other for more exact placement.'
              }
            />
            <div className='Close' onClick={handleCloseRequest}>
              <div className='Circle'>
                <div className='X'>x</div>
              </div>
              <Tooltip description='Close panel.' />
            </div>
          </div>

          {renderNodes()}
        </div>
      </div>
    )
  } else {
    return null
  }
}
