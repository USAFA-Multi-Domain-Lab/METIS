import { useState } from 'react'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import Tooltip from '../communication/Tooltip'
import { Detail, DetailBox, DetailNumber } from '../form/Form'
import NodeActionAssets from './NodeActionAssets'
import './NodeActionEntry.scss'

// This will render an action
// available to a node.

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function NodeActionEntry(props: {
  /**
   * The mission-node-action to be edited.
   */
  action: ClientMissionAction
  /**
   * The current action being displayed. This is used for
   * pagination purposes.
   */
  displayedAction: number
  /**
   * A boolean that will be used to determine if a
   * field has been left empty.
   */
  isEmptyString: boolean
  /**
   * An array of strings that will be used to determine
   * if a field has been left empty.
   */
  actionEmptyStringArray: Array<string>
  /**
   * A function that will set the current action being
   * displayed.
   */
  setDisplayedAction: (displayedAction: number) => void
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   */
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  /**
   * Remounts the component.
   */
  remount: () => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}): JSX.Element | null {
  let action: ClientMissionAction = props.action
  let node: ClientMissionNode = action.node
  let displayedAction: number = props.displayedAction
  let isEmptyString: boolean = props.isEmptyString
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setDisplayedAction = props.setDisplayedAction
  let setActionEmptyStringArray = props.setActionEmptyStringArray
  let remount = props.remount
  let handleChange = props.handleChange
  let deleteActionClassName: string = 'FormButton DeleteAction'
  let nodeActionClassName: string = 'NodeActionEntry'

  /* -- COMPONENT STATE -- */
  const [deliverNameError, setDeliverNameError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>(
    'At least one character is required here.',
  )

  /* -- COMPONENT FUNCTIONS -- */
  const removeActionEmptyString = (field: string) => {
    actionEmptyStringArray.map((actionEmptyString: string, index: number) => {
      if (actionEmptyString === `actionID=${action.actionID}_field=${field}`) {
        actionEmptyStringArray.splice(index, 1)
      }
    })
  }

  const handleDeleteRequest = () => {
    node.actions.delete(action.actionID)
    setDisplayedAction(Math.max(displayedAction - 1, 0))
    setActionEmptyStringArray([])
    handleChange()
  }

  /* -- RENDER -- */

  if (node.actions.size === 1) {
    deleteActionClassName += ' Disabled'
    nodeActionClassName += ' DisableBottomBorder'
  }

  if (node.executable) {
    return (
      <div className={nodeActionClassName}>
        <Detail
          label='Name'
          initialValue={action.name}
          deliverValue={(name: string) => {
            if (name !== '') {
              action.name = name
              removeActionEmptyString('name')
              setDeliverNameError(false)
              remount()
              handleChange()
            } else {
              setDeliverNameError(true)
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=name`,
              ])
              remount()
            }
          }}
          options={{
            deliverError: deliverNameError,
            deliverErrorMessage: errorMessage,
          }}
          key={`${action.actionID}_name`}
        />
        <DetailBox
          label='Description'
          initialValue={action.description}
          deliverValue={(description: string) => {
            action.description = description

            // Equivalent to an empty string.
            if (description !== '<p><br></p>') {
              removeActionEmptyString('description')
              remount()
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=description`,
              ])
              remount()
            }
          }}
          options={{
            elementBoundary: '.BorderBox',
          }}
          key={`${action.actionID}_description`}
        />
        <DetailNumber
          label='Success Chance'
          initialValue={parseFloat(
            `${(action.successChance * 100.0).toFixed(2)}`,
          )}
          options={{
            minimum: 0,
            maximum: 100,
            unit: '%',
          }}
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
          options={{
            minimum: 0,
            maximum: 3600,
            unit: 's',
          }}
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
          deliverValue={(postExecutionSuccessText: string) => {
            action.postExecutionSuccessText = postExecutionSuccessText

            // Equivalent to an empty string.
            if (postExecutionSuccessText !== '<p><br></p>') {
              removeActionEmptyString('postExecutionSuccessText')
              remount()
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionSuccessText`,
              ])
              remount()
            }
          }}
          options={{
            elementBoundary: '.BorderBox',
          }}
          key={`${action.actionID}_postExecutionSuccessText`}
        />
        <DetailBox
          label='Post-Execution Failure Text'
          initialValue={action.postExecutionFailureText}
          deliverValue={(postExecutionFailureText: string) => {
            action.postExecutionFailureText = postExecutionFailureText

            // Equivalent to an empty string.
            if (postExecutionFailureText !== '<p><br></p>') {
              removeActionEmptyString('postExecutionFailureText')
              remount()
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionFailureText`,
              ])
              remount()
            }
          }}
          options={{
            elementBoundary: '.BorderBox',
          }}
          key={`${action.actionID}_postExecutionFailureText`}
        />
        <NodeActionAssets
          action={action}
          isEmptyString={isEmptyString}
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
