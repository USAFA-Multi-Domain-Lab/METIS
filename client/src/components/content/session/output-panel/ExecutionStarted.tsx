import { useEffect, useRef, useState } from 'react'
import ClientExecutionStartedOutput from 'src/missions/forces/outputs/execution-started'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import RichTextOutputBox from '../../communication/RichTextOutputBox'

/**
 * Renders the message for when an action is started.
 */
export default function ExecutionStarted({
  output: {
    _id: outputId,
    time,
    username,
    nodeName,
    actionName,
    processTime,
    successChance,
    resourceCost,
    execution,
  },
}: TExecutionStarted_P): JSX.Element | null {
  /* -- REFS -- */
  const outputRef = useRef<HTMLDivElement>(null)

  /* -- STATE -- */
  const [timeRemaining, setTimeRemaining] = useState<string>(
    execution?.formatTimeRemaining(true) ?? '00:00:00',
  )

  /* -- COMPUTED -- */

  /**
   * The time stamp for the message.
   */
  const timeStamp: string = compute(() =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(time),
  )

  /**
   * The label used for the time remaining list item.
   */
  const timeRemainingLabel: string = compute(() => 'Time Remaining:')

  /**
   * The class name for all list items used with this message.
   * @note This is used to update the time remaining for the action.
   */
  const listItemClassName: string = compute(() => `output-${outputId}`)

  /**
   * The message to display for the execution.
   */
  const message: string = compute(
    () =>
      `<p>Started executing ${nodeName}.</p>` +
      `<ul>` +
      `<li><u>Action Selected:</u> ${actionName}</li>` +
      `<li><u>Time to Execute:</u> ${processTime / 1000} second(s)</li>` +
      `<li><u>Probability of Success:</u> ${successChance * 100}%</li>` +
      `<li><u>Resource Cost:</u> ${resourceCost} resource(s)</li>` +
      `<li><u>${timeRemainingLabel}</u> ${timeRemaining}</li>` +
      `</ul>`,
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
      `.${listItemClassName}`,
    )

    // Loop through each list element.
    listElements?.forEach((element) => {
      // Check if the element contains the time remaining label and has the correct class name.
      if (
        element.innerHTML.includes(timeRemainingLabel) &&
        element.className === listItemClassName
      ) {
        // Update the time remaining element.
        element.innerHTML = `<p><u>${timeRemainingLabel}</u> ${timeRemaining}</p>`
      }
    })
  }, [timeRemaining])

  /* -- RENDER -- */

  return (
    <div className='Text' ref={outputRef}>
      <span className='LineCursor'>
        [{timeStamp}] {username}@{nodeName.replaceAll(' ', '-')}:{' '}
      </span>
      <RichTextOutputBox
        text={message}
        options={{
          // This will add the class name to all list items used with this message.
          listItemClassName,
        }}
      />
    </div>
  )
}

/* ---------------------------- TYPES FOR EXECUTION STARTED ---------------------------- */

/**
 * Prop type for `ExecutionStarted`.
 */
type TExecutionStarted_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientExecutionStartedOutput
}
