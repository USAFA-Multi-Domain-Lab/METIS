import React, { useEffect, useState } from 'react'
import {
  createMission,
  getMission,
  Mission,
  saveMission,
} from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import Branding from '../content/Branding'
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
      setAreUnsavedChanges(true)
      forceUpdate()
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
        <div className='Navigation'>
          <Branding
            goHome={() => appActions.goToPage('MissionSelectionPage', {})}
            tooltipDescription='Go home.'
          />
          <div
            className='Done Link'
            onClick={() => {
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
          >
            Done
          </div>
          <div
            className='PlayTest Link'
            onClick={() => {
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
            }}
          >
            Play test
          </div>
          <div className='Logout Link' onClick={logout}>
            Sign out
          </div>
        </div>
        {
          // -- content --
        }
        <div className='Content'>
          <MissionMap
            mission={mission}
            missionAjaxStatus={EAjaxStatus.Loaded}
            handleNodeSelection={(node: MissionNode) => {
              if (selectedNode?.nodeID !== node.nodeID) {
                selectNode(node)
              } else {
                selectNode(null)
              }
              activateNodeStructuring(false)
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
            handleChange={handleChange}
          />
          <NodeEntry
            node={selectedNode}
            handleChange={handleChange}
            handleDeleteRequest={() => {
              if (selectedNode !== null) {
                handleNodeDeleteRequest(selectedNode)
              }
            }}
            handleCloseRequest={() => selectNode(null)}
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
  handleChange: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let mission: Mission = props.mission
  let handleChange = props.handleChange

  if (active) {
    return (
      <div className='MissionDetails SidePanel'>
        <div className='BorderBox'>
          <Detail
            label='Name'
            initialValue={mission.name}
            deliverValue={(name: string) => {
              mission.name = name
              handleChange()
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
  handleChange: () => void
  handleDeleteRequest: () => void
  handleCloseRequest: () => void
}): JSX.Element | null {
  let node: MissionNode | null = props.node
  let handleChange = props.handleChange
  let handleDeleteRequest = props.handleDeleteRequest
  let handleCloseRequest = props.handleCloseRequest
  let nodeActionDetailsClassName: string = 'NodeActionDetails'
  let noActionsClassName: string = 'NoActions'

  if (!node?.executable) {
    nodeActionDetailsClassName += ' Disabled'
  }

  if (node === null || node.actions.length > 0) {
    noActionsClassName += ' Hidden'
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
          <Detail
            label='Name'
            initialValue={node.name}
            deliverValue={(name: string) => {
              if (node !== null) {
                node.name = name

                handleChange()
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
          <DetailToggle
            label={'Executable'}
            initialValue={node.executable}
            deliverValue={(executable: boolean) => {
              if (node !== null) {
                node.executable = executable
                handleChange()
              }
            }}
            key={`${node.nodeID}_executable`}
          />
          <DetailToggle
            label={'Device'}
            initialValue={node.device}
            lockState={
              node.executable
                ? EToggleLockState.Unlocked
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
          <DetailBox
            label='Pre-Execution Text'
            initialValue={node.preExecutionText}
            disabled={!node.executable}
            deliverValue={(preExecutionText: string) => {
              if (node !== null) {
                node.preExecutionText = preExecutionText

                handleChange()
              }
            }}
            key={`${node.nodeID}_preExecutionText`}
          />
          <DetailBox
            label='Post-Execution Success Text'
            initialValue={node.postExecutionSuccessText}
            disabled={!node.executable}
            deliverValue={(postExecutionSuccessText: string) => {
              if (node !== null) {
                node.postExecutionSuccessText = postExecutionSuccessText

                handleChange()
              }
            }}
            key={`${node.nodeID}_postExecutionSuccessText`}
          />
          <DetailBox
            label='Post-Execution Failure Text'
            initialValue={node.postExecutionFailureText}
            disabled={!node.executable}
            deliverValue={(postExecutionFailureText: string) => {
              if (node !== null) {
                node.postExecutionFailureText = postExecutionFailureText

                handleChange()
              }
            }}
            key={`${node.nodeID}_postExecutionFailureText`}
          />
          <div className={nodeActionDetailsClassName}>
            <div className='Label'>Actions:</div>
            {node.actions.map((action: MissionNodeAction) => (
              <NodeAction
                action={action}
                node={node as any}
                handleChange={handleChange}
                key={action.actionID}
              />
            ))}
            <div
              className={noActionsClassName}
              key={'no-actions-903jfksjdf092j3f'}
            >
              No actions exist for this node. Create one below.
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
                      '',
                      5000,
                      0.5,
                    )
                    node.actions.push(action)
                    handleChange()
                  }
                }}
                tooltipDescription={'Add a new action to this node.'}
                // key={`actual-action_add-new-action_${node.nodeID}`}
              />
              <Action
                purpose={EActionPurpose.Remove}
                handleClick={handleDeleteRequest}
                tooltipDescription={'Delete this node.'}
                // key={`actual-action_delete-node_${node.nodeID}`}
              />
            </div>
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
  handleChange: () => void
}): JSX.Element | null {
  let action: MissionNodeAction = props.action
  let node: MissionNode = props.node
  let handleChange: () => void = props.handleChange

  return (
    <div className='NodeAction'>
      <Detail
        label='Name'
        initialValue={action.name}
        deliverValue={(name: string) => {
          action.name = name
          handleChange()
        }}
        key={`${action.actionID}_name`}
      />
      <DetailBox
        label='Description'
        initialValue={action.description}
        deliverValue={(description: string) => {
          action.description = description
          handleChange()
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
      <div
        className='Delete'
        onClick={() => {
          node.actions.splice(node.actions.indexOf(action), 1)
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
