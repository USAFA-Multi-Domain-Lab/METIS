import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'react-context-hook'
import { createMission, Mission, MissionNode } from '../../modules/missions'
import NodeStructureReference, {
  ENodeTargetRelation,
} from '../../modules/node-reference'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import inputs from '../../modules/toolbox/inputs'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import MissionMap from '../content/MissionMap'
import Tooltip from '../content/Tooltip'
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
  const [nodeStructure, setNodeStructure] =
    useState<NodeStructureReference | null>(null)
  const [selectedNode, selectNode] = useState<MissionNode | null>(null)
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let mission: Mission = createMission()
      let nodeStructure: NodeStructureReference =
        NodeStructureReference.constructNodeStructureReference(
          'ROOT',
          mission.nodeStructure,
        )

      setMission(mission)
      setNodeStructure(nodeStructure)
      setMountHandled(true)
    }
  }, [mountHandled])
  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- COMPONENTS -- */

  /* -- COMPONENT FUNCTIONS -- */

  // Forces a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  const handleNodeStructureChange = (): void => {
    if (mission !== null && nodeStructure !== null) {
      mission.nodeStructure = nodeStructure.deconstructNodeStructureReference()
      forceUpdate()
    }
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

  if (show && mission !== null && nodeStructure !== null) {
    let missionRender = Mission.renderMission(
      mission,
      nodeStructure,
      mission.nodeStructure,
      { ignoreVisibility: true },
    )

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
            mission={missionRender}
            missionAjaxStatus={EAjaxStatus.Loaded}
            handleNodeSelection={(node: MissionNode) => {
              if (selectedNode?.nodeID !== node.nodeID) {
                selectNode(node)
              } else {
                selectNode(null)
              }
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
            nodeStructure={nodeStructure}
            handleNodeStructureChange={handleNodeStructureChange}
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
  nodeStructure: NodeStructureReference
  handleNodeStructureChange: (
    updatedNodeStructure: NodeStructureReference,
  ) => void
  handleCloseRequest: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let nodeStructure: NodeStructureReference = props.nodeStructure
  let handleNodeStructureChange: (
    updatedNodeStructure: NodeStructureReference,
  ) => void = props.handleNodeStructureChange
  let handleCloseRequest = props.handleCloseRequest

  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [nodeGrabbed, grabNode] = useState<NodeStructureReference | null>(null)
  const [nodePendingDrop, pendDrop] = useState<NodeStructureReference | null>(
    null,
  )
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
      pendDrop(nodeStructure)
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

    if (dropPendingHere && nodeStructure.nodeID === nodePendingDrop?.nodeID) {
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
              handleNodeStructureChange(nodeStructure)
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
    structureReference: NodeStructureReference
  }): JSX.Element | null => {
    let structureReference: NodeStructureReference = props.structureReference
    let handleClick = () => {
      structureReference.toggle()
      forceUpdate()
    }
    let className: string = 'Node'

    className += structureReference.expandable ? ' Expandable' : ' Ends'
    className += structureReference.isExpanded ? ' IsExpanded' : ' IsCollapsed'

    if (structureReference.nodeID === nodePendingDrop?.nodeID) {
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
            grabNode(structureReference)
          }}
          onDrop={(event: React.DragEvent) => {
            if (nodePendingDrop !== null) {
              let target: NodeStructureReference = nodePendingDrop
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
                handleNodeStructureChange(nodeStructure)
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
              if (structureReference.nodeID !== nodePendingDrop?.nodeID) {
                pendDrop(structureReference)
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
              if (structureReference.nodeID !== nodePendingDrop?.nodeID) {
                pendDrop(structureReference)
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
            <div className='Name'>{structureReference.nodeID}</div>
          </div>
          <div
            className='Bottom'
            onDragOver={(event: React.DragEvent) => {
              event.preventDefault()
            }}
            onDragEnter={() => {
              if (structureReference.nodeID !== nodePendingDrop?.nodeID) {
                pendDrop(structureReference)
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
        {structureReference.isExpanded ? (
          <div className='Subnodes'>
            {structureReference.subnodes.map(
              (subnode: NodeStructureReference) => (
                <Node structureReference={subnode} key={subnode.nodeID} />
              ),
            )}
          </div>
        ) : null}
      </div>
    )
  }

  // This will render the nodes in the
  // node structuring.
  const renderNodes = (): JSX.Element | null => {
    let nodeElements: Array<JSX.Element | null> = nodeStructure.subnodes.map(
      (subnode: NodeStructureReference) => (
        <Node structureReference={subnode} key={subnode.nodeID} />
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

// This will render a detail for
// a form, with a label and a text
// field for entering information.
function Detail(props: {
  label: string
  initialValue: string
  deliverValue: (value: string) => void
}): JSX.Element | null {
  const field = useRef<HTMLInputElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>()

  let label: string = props.label
  let initialValue: string = props.initialValue
  let deliverValue = props.deliverValue

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLInputElement | null = field.current

      if (fieldElement) {
        fieldElement.value = initialValue
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  return (
    <div className='Detail'>
      <div className='Label'>{`${label}:`}</div>
      <input
        className='Field'
        type='text'
        ref={field}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          deliverValue(event.target.value)
        }}
      />
    </div>
  )
}

// This will render a detail for
// a form, with a label and a number
// field for entering information.
function DetailNumber(props: {
  label: string
  initialValue: number
  minimum?: number // default null
  maximum?: number // default null
  integersOnly?: boolean // default false
  unit?: string // default ''
  deliverValue: (value: number | null) => void
}): JSX.Element | null {
  const field = useRef<HTMLInputElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>()

  let label: string = props.label
  let initialValue: number = props.initialValue
  let minimum: number | null =
    props.minimum !== undefined ? props.minimum : null
  let maximum: number | null =
    props.maximum !== undefined ? props.maximum : null
  let integersOnly: boolean = props.integersOnly || false
  let unit: string = props.unit || ''
  let deliverValue = props.deliverValue

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLInputElement | null = field.current

      if (fieldElement) {
        fieldElement.value = `${initialValue}`
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  // render
  return (
    <div className='Detail DetailNumber'>
      <div className='Label'>{`${label}:`}</div>
      <div className='Unit'>{unit}</div>
      <input
        className='Field'
        type='text'
        ref={field}
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          inputs.enforceNumbericCharsOnly(event)
          if (integersOnly) {
            inputs.enforceIntegersOnly(event)
          }
          if (minimum !== null && minimum >= 0) {
            inputs.enforceNonNegativeOnly(event)
          }
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | null

          if (minimum !== null) {
            inputs.enforceNumberFloor(event, minimum)
          }
          if (maximum !== null) {
            inputs.enforceNumberCap(event, maximum)
          }

          value = parseInt(target.value)
          value = isNaN(value) ? null : value

          deliverValue(value)
        }}
        onBlur={(event: React.FocusEvent) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | null

          value = parseInt(target.value)
          value = isNaN(value) ? null : value

          if (value === null) {
            if (minimum !== null && minimum > 0) {
              value = minimum
            } else if (maximum !== null && maximum < 0) {
              value = maximum
            } else {
              value = 0
            }
          }

          target.value = `${value}`

          deliverValue(value)
        }}
      />
    </div>
  )
}

// This will render a detail for
// a form, with a label and a text
// field for entering information.
function DetailBox(props: {
  label: string
  initialValue: string
  deliverValue: (value: string) => void
}): JSX.Element | null {
  const fieldOffsetHeight: number = 3

  const field = useRef<HTMLTextAreaElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>()

  let label: string = props.label
  let initialValue: string = props.initialValue
  let deliverValue = props.deliverValue

  // Called when a change is made in the
  // in the field element. This will resize
  // the field based on the height of the
  // content.
  const resizeField = (
    event:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    let fieldElement: HTMLTextAreaElement = event.target as HTMLTextAreaElement

    fieldElement.style.height = '1px'
    fieldElement.style.height = `${
      fieldOffsetHeight + fieldElement.scrollHeight
    }px`
  }

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      let fieldElement: HTMLTextAreaElement | null = field.current

      if (fieldElement) {
        fieldElement.value = initialValue
        fieldElement.style.height = '1px'
        fieldElement.style.height = `${
          fieldOffsetHeight + fieldElement.scrollHeight
        }px`
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  // render
  return (
    <div className='Detail DetailBox'>
      <div className='Label'>{`${label}:`}</div>
      <textarea
        className='Field FieldBox'
        ref={field}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          resizeField(event)
          deliverValue(event.target.value)
        }}
      />
    </div>
  )
}
