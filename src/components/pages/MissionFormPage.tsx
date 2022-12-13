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
} from '../content/Form'
import MissionMap from '../content/MissionMap'
import Tooltip from '../content/Tooltip'
import { v4 as generateHash } from 'uuid'
import './MissionFormPage.scss'
import { Action, EActionPurpose } from '../content/Action'
import MoreInformation from '../content/MoreInformation'
import { IPage } from '../App'
import { ENodeTargetRelation, MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { EToggleLockState } from '../content/Toggle'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/Navigation'

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
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [selectedNode, selectNode] = useState<MissionNode | null>(null)
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)
  const [existsInDatabase, setExistsInDatabase] = useState<boolean>(false)
  const [displayedAction, setDisplayedAction] = useState<number>(0)
  const [emptyStringArray, setEmptyStringArray] = useState<Array<string>>([])

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
        setMission(mission)
        existsInDatabase = false
      }
      // Editing an existing mission.
      else {
        appActions.beginLoading('Loading mission...')

        getMission(
          missionID,
          (mission: Mission) => {
            setMission(mission)
            appActions.finishLoading()
            setMountHandled(true)
          },
          () => {
            appActions.finishLoading()
            appActions.handleServerError('Failed to load mission.')
          },
          { expandAllNodes: true },
        )
        existsInDatabase = true
        setExistsInDatabase(existsInDatabase)
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
    /* -- COMPONENTS -- */

    /* -- COMPONENT FUNCTIONS -- */

    // Forces a rerender.
    const forceUpdate = (): void => {
      setForcedUpdateCounter(forcedUpdateCounter + 1)
    }

    // This is called when a change is
    // made that would require saving.
    const handleChange = (): void => {
      if (emptyStringArray.length === 0) {
        setAreUnsavedChanges(true)
        forceUpdate()
      } else {
        setAreUnsavedChanges(false)
        appActions.notify(
          `**Error:** The node called "${selectedNode?.name.toLowerCase()}" has at least one field that was left empty. This field must contain at least one character.`,
          null,
        )
      }
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

    // This is called when a node is
    // requested to be deleted.
    const handleNodeDeleteRequest = (node: MissionNode): void => {
      let confirmationMessage: string = ''

      if (node.hasChildren) {
        confirmationMessage =
          'Please confirm the deletion of this node. \n**This node has child nodes, and all child nodes will be deleted as well.**'
      } else {
        confirmationMessage = 'Please confirm the deletion of this node.'
      }

      appActions.confirm(
        confirmationMessage,
        (concludeAction: () => void, entry?: string) => {
          node.delete()
          handleChange()
          activateNodeStructuring(false)
          selectNode(null)
          concludeAction()
        },
      )
    }

    // This will logout the current user.
    const logout = () =>
      appActions.logout({
        returningPagePath: 'GamePage',
        returningPageProps: { missionID: mission.missionID },
      })

    /* -- RENDER -- */

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
            },
            { text: 'Log out', handleClick: logout, visible: true },
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
          <MissionMap
            mission={mission}
            missionAjaxStatus={EAjaxStatus.Loaded}
            handleNodeSelection={(node: MissionNode) => {
              setDisplayedAction(0)

              if (selectedNode !== null && selectedNode.executable) {
                if (
                  selectedNode.nodeID !== node.nodeID &&
                  emptyStringArray.length === 0
                ) {
                  selectNode(node)
                } else if (
                  selectedNode.nodeID === node.nodeID &&
                  emptyStringArray.length === 0
                ) {
                  selectNode(null)
                } else {
                  appActions.notify(
                    `**Error:** The node called "${selectedNode.name.toLowerCase()}" has at least one field that was left empty. This field must contain at least one character.`,
                    null,
                  )
                }
              } else if (
                selectedNode !== null &&
                selectedNode.nodeID === node.nodeID &&
                !selectedNode.executable
              ) {
                selectNode(null)
              } else {
                selectNode(node)
              }
              activateNodeStructuring(false)

              if (
                node !== null &&
                node.executable &&
                node.actions.length === 0
              ) {
                // Checks to make sure the selected node has at least
                // one action to choose from. If the selected node doesn't
                // have at least one action then it will auto-generate one
                // for that node.
                let newActionArray: Array<MissionNodeAction> = [
                  new MissionNodeAction(
                    node,
                    generateHash(),
                    'New Action',
                    'Enter your description here.',
                    5000,
                    0.5,
                    1,
                    'Enter your successful post-execution message here.',
                    'Enter your failed post-execution message here.',
                  ),
                ]
                node.actions = newActionArray

                appActions.notify(
                  `Auto-generated an action for ${node.name} because it is an executable node with no actions to execute.`,
                  10000,
                )

                handleChange()
              }
            }}
            handleMapCreateRequest={() => {
              let newNode: MissionNode = mission.spawnNewNode()
              handleChange()
              selectNode(newNode)
              activateNodeStructuring(false)
            }}
            handleMapEditRequest={() => {
              activateNodeStructuring(true)
              selectNode(null)
            }}
            handleMapSaveRequest={save}
            editCanBeRequested={!nodeStructuringIsActive}
            saveCanBeRequested={areUnsavedChanges}
            applyNodeClassName={(node: MissionNode) => ''}
            renderNodeTooltipDescription={(node: MissionNode) => ''}
          />
          <MissionDetails
            active={selectedNode === null && !nodeStructuringIsActive}
            mission={mission}
            emptyStringArray={emptyStringArray}
            setEmptyStringArray={setEmptyStringArray}
            handleChange={handleChange}
          />
          <NodeEntry
            node={selectedNode}
            appActions={appActions}
            displayedAction={displayedAction}
            setDisplayedAction={setDisplayedAction}
            emptyStringArray={emptyStringArray}
            setEmptyStringArray={setEmptyStringArray}
            handleChange={handleChange}
            handleDeleteRequest={() => {
              if (selectedNode !== null) {
                handleNodeDeleteRequest(selectedNode)
              }
            }}
            handleCloseRequest={() => {
              selectNode(null)
            }}
          />
          <NodeStructuring
            active={nodeStructuringIsActive}
            mission={mission}
            handleChange={handleChange}
            handleCloseRequest={() => activateNodeStructuring(false)}
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
  emptyStringArray: Array<string>
  setEmptyStringArray: (emptyStringArray: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let mission: Mission = props.mission
  let emptyStringArray: Array<string> = props.emptyStringArray
  let setEmptyStringArray = props.setEmptyStringArray
  let handleChange = props.handleChange

  /* -- COMPONENT FUNCTIONS -- */
  const removeEmptyString = (field: string) => {
    emptyStringArray.map((emptyString: string, index: number) => {
      if (emptyString === `missionID=${mission.missionID}_field=${field}`) {
        emptyStringArray.splice(index, 1)
      }
    })
  }

  if (active) {
    return (
      <div className='MissionDetails SidePanel'>
        <div className='BorderBox'>
          <Detail
            label='Name'
            initialValue={mission.name}
            deliverValue={(name: string) => {
              if (name !== '') {
                mission.name = name
                removeEmptyString('name')
                handleChange()
              } else {
                setEmptyStringArray([
                  ...emptyStringArray,
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
    )
  } else {
    return null
  }
}

// This will render a form where
// a given node can be edited.
function NodeEntry(props: {
  node: MissionNode | null
  appActions: AppActions
  displayedAction: number
  setDisplayedAction: (displayedAction: number) => void
  emptyStringArray: Array<string>
  setEmptyStringArray: (emptyStringArray: Array<string>) => void
  handleChange: () => void
  handleDeleteRequest: () => void
  handleCloseRequest: () => void
}): JSX.Element | null {
  let node: MissionNode | null = props.node
  let appActions: AppActions = props.appActions
  let displayedAction: number = props.displayedAction
  let setDisplayedAction = props.setDisplayedAction
  let emptyStringArray: Array<string> = props.emptyStringArray
  let setEmptyStringArray = props.setEmptyStringArray
  let handleChange = props.handleChange
  let handleDeleteRequest = props.handleDeleteRequest
  let handleCloseRequest = props.handleCloseRequest
  let totalActions: number | undefined = node?.actions.length
  let selectorContainerClassName: string = 'SelectorContainer'
  let actionTitleClassName: string = 'ActionInfo'
  let addNewActionClassName: string = 'Action add'
  let actionKey: string = ''

  /* -- COMPONENT STATE -- */

  /* -- COMPONENT FUNCTIONS -- */

  const displayNextAction = () => {
    if (node?.actions !== undefined) {
      let lastAction: number = node?.actions.length - 1

      if (displayedAction === lastAction) {
        setDisplayedAction(0)
      } else {
        setDisplayedAction(displayedAction + 1)
      }
    }
  }

  const displayPreviousAction = () => {
    if (displayedAction === 0 && node?.actions !== undefined) {
      setDisplayedAction(node?.actions.length - 1)
    } else {
      setDisplayedAction(displayedAction - 1)
    }
  }

  const removeEmptyString = (field: string) => {
    emptyStringArray.map((emptyString: string, index: number) => {
      if (
        node !== null &&
        emptyString === `nodeID=${node.nodeID}_field=${field}`
      ) {
        emptyStringArray.splice(index, 1)
      }
    })
  }

  /* -- RENDER -- */

  // Logic that hides the buttons that select which action is being
  // displayed because there is 1 action or less for the selected node.
  if (
    node === null ||
    node.actions.length === 0 ||
    node.actions.length === 1 ||
    node.actions[0] === undefined
  ) {
    selectorContainerClassName += ' hide'
    actionKey = 'no_action_id_to_choose_from'
  }

  // If a node is not executable then it hides all of the information
  // pertaining to the actions for that node.
  if (node !== null && !node.executable) {
    selectorContainerClassName += ' hide'
    actionTitleClassName += ' Hide'
    addNewActionClassName += ' Hide'
  }

  // Logic that keeps the app from crashing by making the key for the
  // individual action that is being displayed under the action(s) section
  // change dynamically.
  if (node !== null && node.actions.length > 0) {
    actionKey = node.actions[displayedAction].actionID
  } else if (node !== null && node.actions.length <= 0) {
    actionKey = 'no_action_id_to_choose_from'
  }

  if (node !== null) {
    return (
      <div className='NodeEntry SidePanel'>
        <div className='BorderBox'>
          <div className='Close' onClick={handleCloseRequest}>
            <div className='Circle'>
              <div className='X'>x</div>
            </div>
            <Tooltip description='Close panel.' />
          </div>
          <div className='NodeInfoContainer'>
            <Detail
              label='Name'
              initialValue={node.name}
              deliverValue={(name: string) => {
                if (node !== null && name !== '') {
                  node.name = name
                  removeEmptyString('name')
                  handleChange()
                } else if (node !== null) {
                  setEmptyStringArray([
                    ...emptyStringArray,
                    `nodeID=${node.nodeID}_field=name`,
                  ])
                }
              }}
              key={`${node.nodeID}_name`}
            />
            <DetailDropDown
              label={'Color'}
              options={[
                'default',
                'green',
                'pink',
                'yellow',
                'blue',
                'purple',
                'red',
                'khaki',
                'orange',
              ]}
              currentValue={node.color}
              uniqueClassName={'Color'}
              deliverValue={(color: string) => {
                if (node !== null) {
                  node.color = color

                  handleChange()
                }
              }}
              key={`${node.nodeID}_color`}
            />
            <div
              className='ColorFill'
              onClick={() => {
                if (node !== null) {
                  node.applyColorFill()
                  handleChange()
                }
              }}
            >
              {'[ '}
              <span>Fill</span> {' ]'}
              <Tooltip description='Shade all descendant nodes this color as well.' />
            </div>
            <DetailBox
              label='Pre-Execution Text (optional)'
              initialValue={node.preExecutionText}
              deliverValue={(preExecutionText: string) => {
                if (node !== null) {
                  node.preExecutionText = preExecutionText
                  handleChange()
                }
              }}
              key={`${node.nodeID}_preExecutionText`}
            />
            <DetailToggle
              label={'Executable'}
              initialValue={node.executable}
              deliverValue={(executable: boolean) => {
                if (node !== null) {
                  node.executable = executable

                  if (executable && node.actions.length === 0) {
                    // Checks to make sure the selected node has at least one action to choose from. If the selected node does not have at least one action then it will auto-generate one for that node.
                    let newActionArray: Array<MissionNodeAction> = [
                      new MissionNodeAction(
                        node,
                        generateHash(),
                        'New Action',
                        'Enter your description here.',
                        5000,
                        0.5,
                        1,
                        'Enter your successful post-execution message here.',
                        'Enter your failed post-execution message here.',
                      ),
                    ]
                    node.actions = newActionArray

                    appActions.notify(
                      `Auto-generated an action for ${node.name} because it is an executable node with no actions to execute.`,
                      10000,
                    )
                  }
                }

                handleChange()
              }}
              lockState={
                emptyStringArray.length === 0
                  ? EToggleLockState.Unlocked
                  : emptyStringArray.length > 0 && node.executable
                  ? EToggleLockState.LockedActivation
                  : emptyStringArray.length > 0 && !node.executable
                  ? EToggleLockState.LockedDeactivation
                  : EToggleLockState.Unlocked
              }
              key={`${node.nodeID}_executable`}
            />
            <DetailToggle
              label={'Device'}
              initialValue={node.device}
              lockState={
                emptyStringArray.length === 0 && node.executable
                  ? EToggleLockState.Unlocked
                  : emptyStringArray.length > 0 &&
                    node.executable &&
                    node.device
                  ? EToggleLockState.LockedActivation
                  : emptyStringArray.length > 0 &&
                    node.executable &&
                    !node.device
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
            <div className='DeleteNodeContainer'>
              <div className='DeleteNode'>
                [{' '}
                <span className='Text' onClick={handleDeleteRequest}>
                  Delete Node <span className='RightBracket'>]</span>
                  <Tooltip description='Delete this node.' />
                </span>
              </div>
            </div>
          </div>
          <h4 className={actionTitleClassName}>Action(s):</h4>
          <div className='NodeActionDetails'>
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
              node={node}
              appActions={appActions}
              setDisplayedAction={setDisplayedAction}
              emptyStringArray={emptyStringArray}
              setEmptyStringArray={setEmptyStringArray}
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
          <div className='UserActions'>
            <Action
              purpose={EActionPurpose.Add}
              handleClick={() => {
                if (node !== null) {
                  let action: MissionNodeAction = new MissionNodeAction(
                    node,
                    generateHash(),
                    'New Action',
                    'Enter your description here.',
                    5000,
                    0.5,
                    1,
                    'Enter your successful post-execution message here.',
                    'Enter your failed post-execution message here.',
                  )

                  node.actions.push(action)
                  handleChange()
                }
              }}
              tooltipDescription={'Add a new action to this node.'}
              uniqueClassName={addNewActionClassName}
              // key={`actual-action_add-new-action_${node.nodeID}`}
            />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

// This will render an action
// available to a node.
function NodeAction(props: {
  action: MissionNodeAction
  node: MissionNode
  appActions: AppActions
  handleChange: () => void
  setDisplayedAction: (displayedAction: number) => void
  emptyStringArray: Array<string>
  setEmptyStringArray: (emptyStringArray: Array<string>) => void
}): JSX.Element | null {
  let action: MissionNodeAction = props.action
  let node: MissionNode = props.node
  let appActions: AppActions = props.appActions
  let handleChange: () => void = props.handleChange
  let setDisplayedAction: (displayedAction: number) => void =
    props.setDisplayedAction
  let emptyStringArray: Array<string> = props.emptyStringArray
  let setEmptyStringArray = props.setEmptyStringArray
  let nodeActionClassName: string = 'NodeAction'
  let deleteActionClassName: string = 'Delete'
  let addNewActionClassName: string = ''
  let addNewActionTooltipDescription: string = ''

  /* -- COMPONENT FUNCTIONS -- */
  const removeEmptyString = (field: string) => {
    emptyStringArray.map((emptyString: string, index: number) => {
      if (emptyString === `actionID=${action.actionID}_field=${field}`) {
        emptyStringArray.splice(index, 1)
      }
    })
  }

  /* -- RENDER -- */
  if (node !== null && !node.executable) {
    nodeActionClassName += ' Hide'
  }

  if (node.actions.length === 1) {
    deleteActionClassName += ' Disabled'
  }

  if (!node.executable) {
    addNewActionClassName += ' disabled'
    addNewActionTooltipDescription =
      'Toggle the executable button on to be able to create actions.'
  } else {
    addNewActionTooltipDescription = 'Add a new action to this node.'
  }

  if (action !== undefined) {
    return (
      <div className={nodeActionClassName}>
        <Detail
          label='Name'
          initialValue={action.name}
          deliverValue={(name: string) => {
            if (name !== '') {
              action.name = name
              removeEmptyString('name')
              handleChange()
            } else {
              setEmptyStringArray([
                ...emptyStringArray,
                `actionID=${action.actionID}_field=name`,
              ])
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
              removeEmptyString('description')
              handleChange()
            } else {
              setEmptyStringArray([
                ...emptyStringArray,
                `actionID=${action.actionID}_field=description`,
              ])
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
          maximum={60}
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
              removeEmptyString('postExecutionSuccessText')
              handleChange()
            } else {
              setEmptyStringArray([
                ...emptyStringArray,
                `actionID=${action.actionID}_field=postExecutionSuccessText`,
              ])
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
              removeEmptyString('postExecutionFailureText')
              handleChange()
            } else {
              setEmptyStringArray([
                ...emptyStringArray,
                `actionID=${action.actionID}_field=postExecutionFailureText`,
              ])
            }
          }}
          key={`${action.actionID}_postExecutionFailureText`}
        />
        <div
          className={deleteActionClassName}
          onClick={() => {
            if (node.actions.length > 1) {
              node.actions.splice(node.actions.indexOf(action), 1)
            }
            setDisplayedAction(0)
            handleChange()
          }}
          key={`${action.actionID}_delete`}
        >
          {'[ '}
          <span>Delete Action</span> {' ]'}
          <Tooltip description='Delete this action from the node.' />
        </div>
      </div>
    )
  } else {
    return (
      <>
        <h4 className='ActionInfo' style={{ marginBottom: '20px' }}>
          Action(s):
        </h4>
        <div className='NodeAction'>
          <div className='NoActions' key={'no-actions-903jfksjdf092j3f'}>
            No actions exist for this node. Create one below.
          </div>
        </div>
        <div className='UserActions'>
          <Action
            purpose={EActionPurpose.Add}
            handleClick={() => {
              if (node !== null && node.executable) {
                let action: MissionNodeAction = new MissionNodeAction(
                  node,
                  generateHash(),
                  'New Action',
                  'Enter your description here.',
                  5000,
                  0.5,
                  1,
                  'Enter your successful post-execution message here.',
                  'Enter your failed post-execution message here.',
                )

                node.actions.push(action)
                handleChange()
              }
            }}
            tooltipDescription={addNewActionTooltipDescription}
            uniqueClassName={addNewActionClassName}
            // key={`actual-action_add-new-action_${node.nodeID}`}
          />
        </div>
      </>
    )
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
              nodeGrabbed.move(destinationNode, ENodeTargetRelation.Parent)
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
    let handleClick = () => {
      // node.toggle()
      // forceUpdate()
    }
    let className: string = 'Node'

    className += node.expandable ? ' Expandable' : ' Ends'
    className += node.isExpanded ? ' IsExpanded' : ' IsCollapsed'

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

    return (
      <div className={className}>
        <div
          className='ParentNode'
          onClick={handleClick}
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
                  targetRelation = ENodeTargetRelation.FollowingSibling
                  break
                case ENodeDropLocation.Center:
                  targetRelation = ENodeTargetRelation.Parent
                  break
                case ENodeDropLocation.Bottom:
                  targetRelation = ENodeTargetRelation.PreviousSibling
                  break
                default:
                  targetRelation = ENodeTargetRelation.Parent
                  break
              }

              if (nodeGrabbed !== null) {
                nodeGrabbed.move(target, targetRelation)
                target.expand()
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
            <svg className='Indicator'>
              {/* <polygon
                points='0,0 7,0 3.5,7'
                style={{ transformOrigin: '3.5px 3.5px' }}
                className='Triangle'
                fill='#fff'
              /> */}
              {<circle className='Circle' fill='#fff' r='3' cx='3' cy='3' />}
            </svg>
            {/* <div className='Indicator'>•</div> */}
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
        {node.isExpanded ? (
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
          {renderNodes()}
        </div>
      </div>
    )
  } else {
    return null
  }
}
