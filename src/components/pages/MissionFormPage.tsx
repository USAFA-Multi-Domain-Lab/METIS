import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  createTestMission,
  Mission,
  MissionNode,
  ENodeTargetRelation,
} from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import inputs from '../../modules/toolbox/inputs'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import { Detail, DetailBox, DetailNumber } from '../content/Form'
import MissionMap from '../content/MissionMap'
import Tooltip from '../content/Tooltip'
import { v4 as generateHash } from 'uuid'
import './MissionFormPage.scss'

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
            // handleNodeAddition={() => {
            //   let node: MissionNode = new MissionNode(
            //     generateHash(),
            //     'New Node',
            //     'default',
            //     'Node has not been executed.',
            //     'Node has executed successfully.',
            //     'Node has failed to execute.',
            //     '',
            //     true,
            //     [],
            //     0,
            //     0,
            //   )
            // }}
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

  if (node !== null) {
    return (
      <div className='NodeEntry SidePanel'>
        <div className='BorderBox'>
          <div className='Close' onClick={handleCloseRequest}>
            x
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
          <DetailBox
            label='Pre-Execution Text'
            initialValue={node.preExecutionText}
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
            deliverValue={(postExecutionFailureText: string) => {
              if (node !== null) {
                node.postExecutionFailureText = postExecutionFailureText

                handleChange()
              }
            }}
            key={`${node.nodeID}_postExecutionFailureText`}
          />
          <DetailBox
            label='Action'
            initialValue={node.actionData}
            deliverValue={(actionData: string) => {
              if (node !== null) {
                node.actionData = actionData

                handleChange()
              }
            }}
            key={`${node.nodeID}_actionData`}
          />
          <DetailNumber
            label='Success Chance'
            initialValue={0}
            minimum={0}
            maximum={100}
            unit='%'
            deliverValue={(successChancePercentage: number | null) => {
              if (
                node !== null &&
                node?.selectedNodeAction !== null &&
                node.selectedNodeAction.successChance !== null &&
                successChancePercentage !== null
              ) {
                node.selectedNodeAction.successChance =
                  successChancePercentage / 100.0

                handleChange()
              }
            }}
            key={`${node.nodeID}_successChance`}
          />
        </div>
      </div>
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
          <div className='Close' onClick={handleCloseRequest}>
            x
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
