import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  createTestMission,
  Mission,
  MissionNode,
  ENodeTargetRelation,
  MissionNodeAction,
} from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import inputs from '../../modules/toolbox/inputs'
import usersModule, { IUser } from '../../modules/users'
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

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function MissionFormPage(props: {
  show: boolean
}): JSX.Element | null {
  /* -- GLOBAL STATE -- */

  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [currentPagePath, setCurrentPagePath] =
    useStore<string>('currentPagePath')
  const [loadingMessage, setLoadingMessage] = useStore<string | null>(
    'loadingMessage',
  )
  const [errorMessage, setErrorMessage] = useStore<string | null>(
    'errorMessage',
  )

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>()
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [mission, setMission] = useState<Mission | null>(null)
  const [selectedNode, selectNode] = useState<MissionNode | null>(null)
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let mission: Mission = createTestMission(true)
      setMission(mission)
      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- COMPONENTS -- */

  /* -- COMPONENT FUNCTIONS -- */

  // Forces a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // This will logout the current user.
  const logout = () => {
    setLoadingMessage('Signing out...')

    usersModule.logout(
      () => {
        setCurrentUser(null)
        setLoadingMessage(null)
        setCurrentPagePath('AuthPage')
      },
      () => {
        setLoadingMessage(null)
        setErrorMessage('Server is down. Contact system administrator.')
      },
    )
  }

  /* -- RENDER -- */

  let show: boolean = props.show
  let className: string = 'MissionFormPage'

  if (selectedNode !== null || nodeStructuringIsActive) {
    className += ' SidePanelIsExpanded'
  }

  if (show && mission !== null) {
    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <div className='Navigation'>
          <Branding />
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
              selectNode(newNode)
              activateNodeStructuring(false)
            }}
            handleMapEditRequest={
              !nodeStructuringIsActive
                ? () => {
                    activateNodeStructuring(true)
                    selectNode(null)
                  }
                : null
            }
            applyNodeClassName={(node: MissionNode) => ''}
            renderNodeTooltipDescription={(node: MissionNode) => ''}
          />
          <NodeEntry
            node={selectedNode}
            handleChange={forceUpdate}
            handleCloseRequest={() => selectNode(null)}
          />
          <NodeStructuring
            active={nodeStructuringIsActive}
            mission={mission}
            handleCloseRequest={() => activateNodeStructuring(false)}
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
  handleCloseRequest: () => void
}): JSX.Element | null {
  let node: MissionNode | null = props.node
  let handleChange = props.handleChange
  let handleCloseRequest = props.handleCloseRequest
  let nodeActionDetailsClassName: string = 'NodeActionDetails'
  let noActionsClassName: string = 'NoActions'

  if (!node?.executable) {
    nodeActionDetailsClassName += ' Disabled'
  }

  if (node === null || node.nodeActionItems.length > 0) {
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
                node.preExecutionText = postExecutionSuccessText

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
            {node.nodeActionItems.map((action: MissionNodeAction) => (
              <NodeAction
                action={action}
                handleChange={handleChange}
                key={action.text}
              />
            ))}
            <div
              className={noActionsClassName}
              key={'no-actions-903jfksjdf092j3f'}
            >
              No actions exist for this node. Create one below.
            </div>
            <Action
              purpose={EActionPurpose.Add}
              handleClick={() => {
                let action: MissionNodeAction = new MissionNodeAction(
                  'New Action',
                  5000,
                  0.5,
                  false,
                )
                node?.nodeActionItems.push(action)
                handleChange()
              }}
              tooltipDescription={'Add a new action to this node.'}
              key={'actual-action_add-new-action'}
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
  handleChange: () => void
}): JSX.Element | null {
  let action: MissionNodeAction = props.action
  let handleChange: () => void = props.handleChange

  return (
    <div className='NodeAction'>
      <DetailBox
        label='Name'
        initialValue={action.text}
        deliverValue={(name: string) => {
          action.text = name
        }}
        key={`${action.actionID}_actionData`}
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
        label='Time Cost'
        initialValue={action.timeDelay / 1000}
        minimum={0}
        maximum={60}
        unit='s'
        deliverValue={(timeCost: number | null) => {
          if (timeCost !== null) {
            action.timeDelay = timeCost * 1000

            handleChange()
          }
        }}
        key={`${action.actionID}_timeCost`}
      />
    </div>
  )
}

// This will render a form where
// the node structure for the mission
// can be defined.
function NodeStructuring(props: {
  active: boolean
  mission: Mission
  handleCloseRequest: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let mission: Mission = props.mission
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
              <polygon
                points='0,0 7,0 3.5,7'
                style={{ transformOrigin: '3.5px 3.5px' }}
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
