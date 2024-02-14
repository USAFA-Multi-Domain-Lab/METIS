import { useState } from 'react'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import Tooltip from '../communication/Tooltip'
import { Detail, DetailBox, DetailNumber } from '../form/Form'
import './NodeActionEntry.scss'
import Effects from './target-effects/Effects'
import { compute } from 'src/toolbox'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function NodeActionEntry(
  props: TNodeActionEntry,
): JSX.Element | null {
  /* -- PROPS -- */
  let {
    action,
    displayedAction,
    actionEmptyStringArray,
    setDisplayedAction,
    setActionEmptyStringArray,
    remount,
    handleChange,
  } = props
  let node = action.node

  /* -- STATE -- */
  const [deliverNameError, setDeliverNameError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>(
    'At least one character is required here.',
  )

  /* -- FUNCTIONS -- */
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

  /* -- COMPUTED -- */

  /**
   * The class name for the node action entry.
   */
  const nodeActionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['NodeActionEntry']

    // If there is only one action then disable the bottom border.
    if (node.actions.size === 1) {
      classList.push('DisableBottomBorder')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /**
   * The class name for the delete action button.
   */
  const deleteActionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['FormButton', 'DeleteAction']

    // If there is only one action then disable the delete button.
    if (node.actions.size === 1) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- RENDER -- */

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
          deliverValue={(
            successChancePercentage: number | null | undefined,
          ) => {
            if (
              successChancePercentage !== null &&
              successChancePercentage !== undefined
            ) {
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
          deliverValue={(timeCost: number | null | undefined) => {
            if (timeCost !== null && timeCost !== undefined) {
              action.processTime = timeCost * 1000

              handleChange()
            }
          }}
          key={`${action.actionID}_timeCost`}
        />
        <DetailNumber
          label='Resource Cost'
          initialValue={action.resourceCost}
          deliverValue={(resourceCost: number | null | undefined) => {
            if (resourceCost !== null && resourceCost !== undefined) {
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
        <Effects action={action} />
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

/* ---------------------------- TYPES FOR NODE ACTION ENTRY ---------------------------- */

/**
 * Props for NodeActionEntry component
 */
export type TNodeActionEntry = {
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
   * An array of strings that will be used to determine
   * if a field has been left empty.
   */
  actionEmptyStringArray: string[]
  /**
   * A function that will set the current action being
   * displayed.
   */
  setDisplayedAction: (displayedAction: number) => void
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   */
  setActionEmptyStringArray: (actionEmptyStringArray: string[]) => void
  /**
   * Remounts the component.
   */
  remount: () => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
