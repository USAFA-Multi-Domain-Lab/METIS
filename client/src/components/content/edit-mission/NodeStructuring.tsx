import { useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import ClientMission from 'src/missions'
import ClientMissionPrototype, {
  TPrototypeRelation,
} from 'src/missions/nodes/prototypes'
import { useRequireLogin } from 'src/toolbox/hooks'
import If from '../util/If'
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
  mission: ClientMission
  onChange: (...prototypes: ClientMissionPrototype[]) => void
}): JSX.Element | null {
  /* -- PROPS -- */

  let mission: ClientMission = props.mission
  let onChange = props.onChange
  let root: ClientMissionPrototype = mission.root

  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { forceUpdate } = globalContext.actions
  const [nodeGrabbed, grabNode] = useState<ClientMissionPrototype | null>(null)
  const [nodePendingDrop, pendDrop] = useState<ClientMissionPrototype | null>(
    null,
  )
  const [dropLocation, setDropLocation] = useState<ENodeDropLocation>(
    ENodeDropLocation.Center,
  )
  const { isAuthorized } = useRequireLogin()

  /* -- FUNCTIONS -- */

  /* -- RENDER -- */

  const Padding = (props: { uniqueClassName?: string }): JSX.Element | null => {
    const [dropPendingHere, setDropPendingHere] = useState<boolean>(false)

    let uniqueClassName: string | undefined = props.uniqueClassName
    let className: string | undefined = 'Padding'

    // This will set this padding as
    // the currently hovered over drop
    // zone.
    const pendDropHere = (): void => {
      setDropPendingHere(true)
      pendDrop(root)
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

    if (dropPendingHere && root._id === nodePendingDrop?._id) {
      className += ' DropPending'
    }

    return (
      <div
        className={className}
        draggable={isAuthorized('missions_write')}
        onDragOver={(event: React.DragEvent) => {
          event.preventDefault()
        }}
        onDragEnter={pendDropHere}
        onDragLeave={cancelDropHere}
        onDrop={(event: React.DragEvent) => {
          if (nodePendingDrop !== null) {
            let destinationNode = nodePendingDrop

            if (nodeGrabbed !== null) {
              nodeGrabbed.move(destinationNode, 'child-of-target')
              onChange(nodeGrabbed, destinationNode)
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
    node: ClientMissionPrototype
    disableDropPending?: boolean
  }): JSX.Element | null => {
    let node: ClientMissionPrototype = props.node
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
          draggable={isAuthorized('missions_write')}
          onDragCapture={() => {
            grabNode(node)
          }}
          onDrop={(event: React.DragEvent) => {
            if (nodePendingDrop !== null) {
              let target: ClientMissionPrototype = nodePendingDrop
              let targetRelation: TPrototypeRelation

              switch (dropLocation) {
                case ENodeDropLocation.Top:
                  targetRelation = 'previous-sibling-of-target'
                  break
                case ENodeDropLocation.Center:
                  targetRelation = 'child-of-target'
                  break
                case ENodeDropLocation.Bottom:
                  targetRelation = 'following-sibling-of-target'
                  break
                default:
                  targetRelation = 'child-of-target'
                  break
              }

              if (nodeGrabbed !== null) {
                nodeGrabbed.move(target, targetRelation)
                onChange(nodeGrabbed, target)
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
            <If condition={node.hasChildren}>
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
            </If>
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
            {node.children.map((childNode: ClientMissionPrototype) => (
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
    let nodeElements: Array<JSX.Element | null> = root.children.map(
      (childNode: ClientMissionPrototype) => (
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

  return (
    <div className='NodeStructuring SidePanel'>
      <div className='BorderBox'>{renderNodes()}</div>
    </div>
  )
}
