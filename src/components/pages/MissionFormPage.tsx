import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'react-context-hook'
import { createTestMission, Mission, MissionNode } from '../../modules/missions'
import NodeStructureReference from '../../modules/node-reference'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import inputs from '../../modules/toolbox/inputs'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import MissionMap from '../content/MissionMap'
import './MissionFormPage.scss'

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
  const [mission, selectMission] = useState<Mission | null>(null)
  const [selectedNode, selectNode] = useState<MissionNode | null>(null)

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      selectMission(createTestMission())
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

  if (selectedNode !== null) {
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
              if (selectedNode?.instanceID !== node.instanceID) {
                selectNode(node)
              } else {
                selectNode(null)
              }
            }}
            applyNodeClassName={(node: MissionNode) => ''}
            renderNodeTooltipDescription={(node: MissionNode) => ''}
          />
          <NodeEntry node={selectedNode} handleChange={forceUpdate} />
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
}): JSX.Element | null {
  let node: MissionNode | null = props.node
  let handleChange = props.handleChange

  if (node !== null) {
    return (
      <div className='NodeEntry SidePanel'>
        <div className='BorderBox'>
          <Detail
            label='Name'
            initialValue={node.name}
            deliverValue={(name: string) => {
              if (node !== null) {
                node.name = name

                handleChange()
              }
            }}
            key={`${node.instanceID}_name`}
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
            key={`${node.instanceID}_preExecutionText`}
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
            key={`${node.instanceID}_postExecutionSuccessText`}
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
            key={`${node.instanceID}_postExecutionFailureText`}
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
            key={`${node.instanceID}_actionData`}
          />
          <DetailNumber
            label='Success Chance'
            initialValue={node.successChance * 100}
            minimum={0}
            maximum={100}
            unit='%'
            deliverValue={(successChancePercentage: number | null) => {
              if (node !== null && successChancePercentage !== null) {
                node.successChance = successChancePercentage / 100.0

                handleChange()
              }
            }}
            key={`${node.instanceID}_successChance`}
          />
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
