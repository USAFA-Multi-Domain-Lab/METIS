import { useState } from 'react'
import MissionAction from '../../../../../shared/missions/actions'
import MissionNode from '../../../../../shared/missions/nodes'
import Tooltip from '../communication/Tooltip'
import { Detail, DetailBox, DetailNumber } from '../form/Form'
import NodeActionAssets from './NodeActionAssets'
import './NodeActionEntry.scss'

// This will render an action
// available to a node.
export default function NodeActionEntry(props: {
  action: MissionAction
  displayedAction: number
  isEmptyString: boolean
  actionEmptyStringArray: Array<string>
  setDisplayedAction: (displayedAction: number) => void
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  setMountHandled: (mountHandled: boolean) => void
  handleChange: () => void
}): JSX.Element | null {
  let action: MissionAction = props.action
  let node: MissionNode = action.node
  let displayedAction: number = props.displayedAction
  let isEmptyString: boolean = props.isEmptyString
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let setDisplayedAction = props.setDisplayedAction
  let setActionEmptyStringArray = props.setActionEmptyStringArray
  let setMountHandled: (mountHandled: boolean) => void = props.setMountHandled
  let handleChange = props.handleChange
  let deleteActionClassName: string = 'FormButton DeleteAction'
  let nodeActionClassName: string = 'NodeActionEntry'

  /* -- COMPONENT STATE -- */
  const [deliverNameError, setDeliverNameError] = useState<boolean>(false)
  const [deliverDescriptionError, setDeliverDescriptionError] =
    useState<boolean>(false)
  const [
    deliverPostExecutionSuccessTextError,
    setDeliverPostExecutionSuccessTextError,
  ] = useState<boolean>(false)
  const [
    deliverPostExecutionFailureTextError,
    setDeliverPostExecutionFailureTextError,
  ] = useState<boolean>(false)
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
    if (action === node.actions[0]) {
      node.actions.shift()
      setDisplayedAction(0)
    } else if (node.actions.length > 1) {
      node.actions.splice(node.actions.indexOf(action), 1)
      setDisplayedAction(displayedAction - 1)
    }

    setActionEmptyStringArray([])
    handleChange()
  }

  /* -- RENDER -- */

  if (node.actions.length === 1) {
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
              setMountHandled(false)
              handleChange()
            } else {
              setDeliverNameError(true)
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=name`,
              ])
              setMountHandled(false)
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
            if (description !== '') {
              action.description = description
              removeActionEmptyString('description')
              setDeliverDescriptionError(false)
              setMountHandled(false)
              handleChange()
            } else {
              setDeliverDescriptionError(true)
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=description`,
              ])
              setMountHandled(false)
            }
          }}
          options={{
            deliverError: deliverDescriptionError,
            deliverErrorMessage: errorMessage,
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
            if (postExecutionSuccessText !== '') {
              action.postExecutionSuccessText = postExecutionSuccessText
              removeActionEmptyString('postExecutionSuccessText')
              setDeliverPostExecutionSuccessTextError(false)
              setMountHandled(false)
              handleChange()
            } else {
              setDeliverPostExecutionSuccessTextError(true)
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionSuccessText`,
              ])
              setMountHandled(false)
            }
          }}
          options={{
            deliverError: deliverPostExecutionSuccessTextError,
            deliverErrorMessage: errorMessage,
          }}
          key={`${action.actionID}_postExecutionSuccessText`}
        />
        <DetailBox
          label='Post-Execution Failure Text'
          initialValue={action.postExecutionFailureText}
          deliverValue={(postExecutionFailureText: string) => {
            if (postExecutionFailureText !== '') {
              action.postExecutionFailureText = postExecutionFailureText
              removeActionEmptyString('postExecutionFailureText')
              setDeliverPostExecutionFailureTextError(false)
              setMountHandled(false)
              handleChange()
            } else {
              setDeliverPostExecutionFailureTextError(true)
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionFailureText`,
              ])
              setMountHandled(false)
            }
          }}
          options={{
            deliverError: deliverPostExecutionFailureTextError,
            deliverErrorMessage: errorMessage,
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
