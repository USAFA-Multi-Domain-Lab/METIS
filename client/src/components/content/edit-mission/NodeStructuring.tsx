import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionNode, { ENodeTargetRelation } from 'src/missions/nodes'
import MoreInformation from '../communication/MoreInformation'
import Tooltip from '../communication/Tooltip'
import './NodeStructuring.scss'

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

// This will render a form where
// the node structure for the mission
// can be defined.
export default function NodeStructuring(props: {
  active: boolean
  mission: ClientMission
  handleChange: () => void
  handleCloseRequest: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let mission: ClientMission = props.mission
  let handleChange = props.handleChange
  let handleCloseRequest = props.handleCloseRequest
  // todo: Fix this to use prototypes.
  let rootNode: ClientMissionNode = mission.forces[0].root

  const globalContext = useGlobalContext()
  const { forceUpdate } = globalContext.actions
  const [nodeGrabbed, grabNode] = useState<ClientMissionNode | null>(null)
  const [nodePendingDrop, pendDrop] = useState<ClientMissionNode | null>(null)
  const [dropLocation, setDropLocation] = useState<ENodeDropLocation>(
    ENodeDropLocation.Center,
  )

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

    if (dropPendingHere && rootNode._id === nodePendingDrop?._id) {
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
    node: ClientMissionNode
    disableDropPending?: boolean
  }): JSX.Element | null => {
    let node: ClientMissionNode = props.node
    let disableDropPending: boolean = props.disableDropPending === true

    /* -- COMPONENT FUNCTIONS -- */
    const toggleNode = () => {
      node.toggleMenuExpansion()
      forceUpdate()
    }

    /* -- RENDER -- */
    let className: string = 'Node'
    let indicatorClassName: string = 'Indicator'

    className += node.hasChildren ? ' Expandable' : ' Ends'

    if (node._id === nodeGrabbed?._id) {
      disableDropPending = true
    }

    if (node._id === nodePendingDrop?._id) {
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
              let target: ClientMissionNode = nodePendingDrop
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
              if (node._id !== nodePendingDrop?._id && !disableDropPending) {
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
              if (node._id !== nodePendingDrop?._id && !disableDropPending) {
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
            <svg
              className={indicatorClassName}
              onMouseUp={toggleNode}
              key={`${node._id}_triangle`}
            >
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
              if (node._id !== nodePendingDrop?._id && !disableDropPending) {
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
            {node.children.map((childNode: ClientMissionNode) => (
              <Node
                node={childNode}
                disableDropPending={disableDropPending}
                key={childNode._id}
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
    let nodeElements: Array<JSX.Element | null> = rootNode.children.map(
      (childNode: ClientMissionNode) => (
        <Node node={childNode} key={childNode._id} />
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
              <div className='CloseButton'>
                x
                <Tooltip description='Close panel.' />
              </div>
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
