import { useEffect, useRef, useState } from 'react'
import ClientOutput from 'src/missions/forces/output'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import Tooltip from '../../communication/Tooltip'
import RichText from '../../general-layout/RichText'

/**
 * Renders the message for when an action is started.
 */
export default function ExecutionStarted({
  output: { _id: outputId, node, action, timeStamp, prefix, execution },
  selectNode,
}: TExecutionStarted_P): JSX.Element | null {
  /* -- REFS -- */
  const outputRef = useRef<HTMLDivElement>(null)

  /* -- STATE -- */
  const [timeRemaining, setTimeRemaining] = useState<string>(
    execution?.formatTimeRemaining(true) ?? '00:00:00',
  )

  /* -- COMPUTED -- */

  /**
   * The label used for the time remaining list item.
   */
  const timeRemainingLabel: string = compute(() => 'Time Remaining:')

  /**
   * The class name for all list items used with this message.
   * @note This is used to update the time remaining for the action.
   */
  const listClassName: string = compute(() => `output-${outputId}`)

  /**
   * The message to display for the execution.
   */
  const message: string = compute(() =>
    node && action
      ? `<p>Started executing on ${node.name}.</p>` +
        `<ul>` +
        `<li><u>Action Selected:</u> ${action.name}</li>` +
        `<li><u>Time to Execute:</u> ${
          action.processTime / 1000
        } second(s)</li>` +
        `<li><u>Probability of Success:</u> ${
          action.successChance * 100
        }%</li>` +
        `<li><u>Resource Cost:</u> ${action.resourceCost} resource(s)</li>` +
        `<li><u>${timeRemainingLabel}</u> ${timeRemaining}</li>` +
        `</ul>`
      : '',
  )

  /**
   * The JSX used to locate the node.
   */
  const locateNodeJsx: JSX.Element | null = compute(() =>
    node ? (
      <div className='Location' onClick={() => selectNode(node)}>
        <Tooltip
          description={`Generated as a result of interacting with the node called "${node.name}."`}
        />
      </div>
    ) : null,
  )

  /* -- EFFECTS -- */

  // When the component mounts, update the time remaining for the action every 10 milliseconds
  // until the action is done executing.
  useMountHandler((done) => {
    // Update the time remaining every 10 milliseconds.
    const interval = setInterval(() => {
      setTimeRemaining(execution?.formatTimeRemaining(true) ?? '00:00:00')

      // Check if the action is done executing.
      if (
        !execution ||
        execution.timeRemaining === 0 ||
        outputRef.current === null
      ) {
        clearInterval(interval)
      }

      // Cleanup the interval when the component unmounts.
      return () => clearInterval(interval)
    }, 10)

    done()
  })

  // Update the time remaining in the output.
  useEffect(() => {
    // Grab all list elements within the output.
    const listElements = outputRef.current?.querySelectorAll(
      `.${listClassName}`,
    )

    // Loop through each list element.
    listElements?.forEach((element) => {
      // Check if the element contains the time remaining label and has the correct class name.
      if (
        element.innerHTML.includes(timeRemainingLabel) &&
        element.className === listClassName
      ) {
        // Update the time remaining element.
        element.innerHTML = `<p><u>${timeRemainingLabel}</u> ${timeRemaining}</p>`
      }
    })
  }, [timeRemaining])

  /* -- RENDER -- */

  if (node && action && !!message) {
    return (
      <div className='Text' ref={outputRef}>
        <span className='LineCursor'>
          {locateNodeJsx} [{timeStamp}] {prefix}{' '}
        </span>
        <RichText
          options={{ content: message, editable: false, listClassName }}
        />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR EXECUTION STARTED ---------------------------- */

/**
 * Prop type for `ExecutionStarted`.
 */
type TExecutionStarted_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientOutput
  /**
   * Selects a node.
   * @param node The node to select.
   */
  selectNode: (node: ClientMissionNode | null) => void
}
