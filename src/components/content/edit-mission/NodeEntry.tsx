import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import { MissionNode } from '../../../modules/mission-nodes'
import { Mission } from '../../../modules/missions'
import { AppActions } from '../../AppState'
import Tooltip from '../communication/Tooltip'
import {
  Detail,
  DetailBox,
  DetailDropDown,
  DetailNumber,
  DetailToggle,
} from '../form/Form'
import { EToggleLockState } from '../user-controls/Toggle'
import NodeActionDetails from './NodeActionDetails'
import './NodeEntry.scss'

// This will render a form where
// a given node can be edited.
export default function NodeEntry(props: {
  node: MissionNode | null
  appActions: AppActions
  displayedAction: number
  nodeEmptyStringArray: Array<string>
  actionEmptyStringArray: Array<string>
  setDisplayedAction: (displayedAction: number) => void
  setNodeEmptyStringArray: (nodeEmptyStringArray: Array<string>) => void
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  handleChange: () => void
  handleAddRequest: () => void
  handleDeleteRequest: () => void
  handleCloseRequest: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let node: MissionNode | null = props.node
  let appActions: AppActions = props.appActions
  let displayedAction: number = props.displayedAction
  let nodeEmptyStringArray: Array<string> = props.nodeEmptyStringArray
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setDisplayedAction = props.setDisplayedAction
  let setNodeEmptyStringArray = props.setNodeEmptyStringArray
  let setActionEmptyStringArray = props.setActionEmptyStringArray
  let handleChange = props.handleChange
  let handleAddNodeRequest = props.handleAddRequest
  let handleDeleteRequest = props.handleDeleteRequest
  let handleCloseRequest = props.handleCloseRequest
  let isEmptyString: boolean =
    nodeEmptyStringArray.length > 0 || actionEmptyStringArray.length > 0

  /* -- GLOBAL STATE -- */
  const [colorOptions] = useStore<Array<string>>('missionNodeColors')

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

  // If a field that was previously left empty
  // meets the requirements then this will remove
  // the key that was stored when the field was empty
  // which will let the user know that the field has
  // met its requirements when the state updates.
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

  // Default class names
  let boxTopClassName: string = 'BoxTop'
  let closeClassName: string = 'Close'
  let deleteNodeClassName: string = 'FormButton DeleteNode'
  let addNodeClassName: string = 'FormButton AddNode'

  // Default error message
  let toggleErrorMessage: string | undefined = undefined

  if (node !== null) {
    let mission: Mission = node.mission

    if (isEmptyString) {
      closeClassName += ' Disabled'
      toggleErrorMessage =
        'The button above is locked until there are no empty fields.'
      boxTopClassName += ' IsError'
      addNodeClassName += ' Disabled'
    }

    // Logic to disable the delete node button
    if (mission.nodes.size < 2) {
      deleteNodeClassName += ' Disabled'
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
                    { duration: null, errorMessage: true },
                  )
                }
                setMountHandled(false)
              }}
              key={'close-node-side-panel'}
            >
              <div className='CloseButton'>
                x
                <Tooltip description='Close panel.' />
              </div>
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
              options={colorOptions}
              uniqueClassName={'Color'}
              currentValue={`Choose a color`}
              isExpanded={true}
              uniqueDropDownStyling={{}}
              uniqueOptionStyling={(color) => {
                if (node && node.color === color) {
                  return {
                    backgroundColor: `${color}`,
                    width: '65%',
                    height: '62%',
                    margin: '4px 3px 3px 4px',
                    border: '2px solid black',
                  }
                } else {
                  return {
                    backgroundColor: `${color}`,
                  }
                }
              }}
              renderOptionClassName={(color) => {
                return ''
              }}
              renderDisplayName={(color) => color}
              deliverValue={(color: string) => {
                if (node !== null) {
                  node.color = color

                  handleChange()
                }
              }}
              key={`${node.nodeID}_color`}
            />
            <div className='ColorInfo'>
              <div className='SelectedColorText'>
                Selected color:{' '}
                <span
                  className='SelectedColorBox'
                  style={{ backgroundColor: `${node.color}` }}
                >
                  {node.color}
                </span>
              </div>
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
            </div>
            <DetailBox
              label='Description (optional)'
              initialValue={node.description}
              emptyStringAllowed={true}
              deliverValue={(description: string) => {
                if (
                  node !== null
                  // description !== '<p><br></p>' &&
                  // description !== null
                ) {
                  node.description = description
                  handleChange()
                  // removeNodeEmptyString('description')
                  // setMountHandled(false)
                }
                // else if (node !== null) {
                //   setNodeEmptyStringArray([
                //     ...nodeEmptyStringArray,
                //     `nodeID=${node.nodeID}_field=description`,
                //   ])
                //   setMountHandled(false)
                // }
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
                    // Checks to make sure the selected node has
                    // at least one action to choose from. If the
                    // selected node does not have at least one
                    // action then it will auto-generate one for
                    // that node.
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
          <NodeActionDetails
            node={node}
            appActions={appActions}
            isEmptyString={isEmptyString}
            displayedAction={displayedAction}
            actionEmptyStringArray={actionEmptyStringArray}
            setActionEmptyStringArray={setActionEmptyStringArray}
            setDisplayedAction={setDisplayedAction}
            setMountHandled={setMountHandled}
            handleChange={handleChange}
          />
        </div>
      </div>
    )
  } else {
    return null
  }
}
