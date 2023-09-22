import { MissionNodeAction } from '../../../modules/mission-node-actions'
import { MissionNode } from '../../../modules/mission-nodes'
import { AppActions } from '../../AppState'
import Tooltip from '../communication/Tooltip'
import { Detail, DetailBox, DetailNumber } from '../form/Form'
import NodeActionAssets from './NodeActionAssets'
import './NodeActionEntry.scss'

// This will render an action
// available to a node.
export default function NodeActionEntry(props: {
  action: MissionNodeAction
  displayedAction: number
  isEmptyString: boolean
  actionEmptyStringArray: Array<string>
  appActions: AppActions
  setDisplayedAction: (displayedAction: number) => void
  setActionEmptyStringArray: (actionEmptyStringArray: Array<string>) => void
  setMountHandled: (mountHandled: boolean) => void
  handleChange: () => void
}): JSX.Element | null {
  let action: MissionNodeAction = props.action
  let node: MissionNode = action.node
  let displayedAction: number = props.displayedAction
  let isEmptyString: boolean = props.isEmptyString
  let actionEmptyStringArray: Array<string> = props.actionEmptyStringArray
  let appActions: AppActions = props.appActions
  let setDisplayedAction = props.setDisplayedAction
  let setActionEmptyStringArray = props.setActionEmptyStringArray
  let setMountHandled = props.setMountHandled
  let handleChange = props.handleChange
  let deleteActionClassName: string = 'FormButton DeleteAction'
  let nodeActionClassName: string = 'NodeActionEntry'

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
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=name`,
              ])
              setMountHandled(false)
            }
          }}
          key={`${action.actionID}_name`}
        />
        <DetailBox
          label='Description'
          initialValue={action.description}
          deliverValue={(description: string) => {
            action.description = description

            if (description !== '<p><br></p>') {
              removeActionEmptyString('description')
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=description`,
              ])
              setMountHandled(false)
            }
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
          maximum={3600}
          unit='s'
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

            if (postExecutionSuccessText !== '<p><br></p>') {
              removeActionEmptyString('postExecutionSuccessText')
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionSuccessText`,
              ])
              setMountHandled(false)
            }
          }}
          key={`${action.actionID}_postExecutionSuccessText`}
        />
        <DetailBox
          label='Post-Execution Failure Text'
          initialValue={action.postExecutionFailureText}
          deliverValue={(postExecutionFailureText: string) => {
            action.postExecutionFailureText = postExecutionFailureText

            if (postExecutionFailureText !== '<p><br></p>') {
              removeActionEmptyString('postExecutionFailureText')
              setMountHandled(false)
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionFailureText`,
              ])
              setMountHandled(false)
            }
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
