import { useEffect, useRef, useState } from 'react'
import RichTextOutputBox from 'src/components/content/communication/RichTextOutputBox'
import ClientMissionForce from 'src/missions/forces'
import {
  TClientExecutionFailed,
  TClientExecutionStarted,
  TClientExecutionSucceeded,
  TClientIntro,
  TClientOutput,
  TClientPreExecution,
} from 'src/missions/forces/output'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useEventListener } from 'src/toolbox/hooks'
import StringToolbox from '../../../../../shared/toolbox/strings'
import './OutputPanel.scss'

/**
 * A panel for displaying messages in the session.
 */
export default function OutputPanel({ force }: TOutputPanel_P): JSX.Element {
  /* -- STATE -- */
  const [outputs, setOutputs] = useState<ClientMissionForce['outputs']>(
    force.outputs,
  )

  /* -- EFFECTS -- */

  // Listen for new outputs.
  useEventListener(force, 'output', () => {
    setOutputs([...force.outputs])
  })

  /* -- RENDER -- */
  return (
    <div className='OutputPanel'>
      <div className='BorderBox'>
        {outputs.map((output) => {
          let timeStamp: string = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(output.time)

          switch (output.type) {
            case 'intro-message':
              return (
                <IntroMessage
                  timeStamp={timeStamp}
                  forceName={force.name}
                  introMessage={output.introMessage}
                  key={`message-${output._id}_type-${output.type}_time-stamp-${timeStamp}`}
                />
              )
            case 'pre-execution':
              return (
                <PreExecution
                  timeStamp={timeStamp}
                  username={output.username}
                  nodeName={output.nodeName}
                  preExecutionMessage={output.preExecutionMessage}
                  key={`message-${output._id}_type-${output.type}_time-stamp-${timeStamp}`}
                />
              )
            case 'execution-started':
              // Get the node that the action is being executed on.
              let node = force.getNode(output.nodeId)
              // Render the message if the node exists.
              return node ? (
                <ExecutionStarted
                  node={node}
                  timeStamp={timeStamp}
                  username={output.username}
                  nodeName={output.nodeName}
                  actionName={output.actionName}
                  processTime={output.processTime}
                  successChance={output.successChance}
                  resourceCost={output.resourceCost}
                  key={`message-${output._id}_type-${output.type}_time-stamp-${timeStamp}`}
                />
              ) : null
            case 'execution-succeeded':
              return (
                <ExecutionDone
                  timeStamp={timeStamp}
                  outputType={output.type}
                  username={output.username}
                  nodeName={output.nodeName}
                  postExecutionMessage={output.postExecutionSuccessMessage}
                  key={`message-${output._id}_type-${output.type}_time-stamp-${timeStamp}`}
                />
              )
            case 'execution-failed':
              return (
                <ExecutionDone
                  timeStamp={timeStamp}
                  outputType={output.type}
                  username={output.username}
                  nodeName={output.nodeName}
                  postExecutionMessage={output.postExecutionFailureMessage}
                  key={`message-${output._id}_type-${output.type}_time-stamp-${timeStamp}`}
                />
              )
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

/**
 * Renders the intro message for the force.
 */
function IntroMessage({
  timeStamp,
  forceName,
  introMessage,
}: TIntro_P): JSX.Element {
  /* -- RENDER -- */
  return (
    <div className='Text'>
      <span className='LineCursor Intro'>
        [{timeStamp}] {forceName.replaceAll(' ', '-')}:{' '}
      </span>
      <RichTextOutputBox text={introMessage} />
    </div>
  )
}

/**
 * Renders the pre-execution message for a selected node.
 */
function PreExecution({
  timeStamp,
  username,
  nodeName,
  preExecutionMessage,
}: TPreExecution_P): JSX.Element {
  /* -- COMPUTED -- */

  /**
   * The class name for the text.
   */
  const textClassName: string = compute(() => {
    // Class list for the text.
    let classList: string[] = ['Text']

    // Hide the message if it is empty.
    if (preExecutionMessage === '') {
      classList.push('Hidden')
    }

    // Return the class list as a string.
    return classList.join(' ')
  })

  /* -- RENDER -- */
  return (
    <div className={textClassName}>
      <span className='LineCursor'>
        [{timeStamp}] {username}@{nodeName.replaceAll(' ', '-')}:{' '}
      </span>
      <RichTextOutputBox text={preExecutionMessage} />
    </div>
  )
}

/**
 * Renders the message for when an action is started.
 */
function ExecutionStarted({
  node,
  timeStamp,
  username,
  nodeName,
  actionName,
  processTime,
  successChance,
  resourceCost,
}: TExecutionStarted_P): JSX.Element {
  /* -- REFS -- */
  const outputRef = useRef<HTMLDivElement>(null)

  /* -- STATE -- */

  /**
   * The execution state of the node.
   * @note This is used to update the time remaining for the action.
   */
  const [executionState, setExecutionState] = useState<
    ClientMissionNode['executionState']
  >(node.executionState)
  /**
   * The class name for all list items used with this message.
   * @note This is used to update the time remaining for the action.
   */
  const [listItemClassName] = useState<string>(
    `output-${StringToolbox.generateRandomId()}`,
  )
  /**
   * The HTML list item element (wrapped in a string) for the time remaining.
   */
  const [timeRemainingLabel] = useState<string>('Time Remaining:')

  /* -- EFFECTS -- */

  // Listen for action execution updates on the node.
  useEventListener(node, 'exec-state-change', () => {
    setExecutionState(node.executionState)
  })

  // Update the time remaining for the action.
  useEffect(() => {
    // Grab all list elements within the output.
    const listElements = outputRef.current?.querySelectorAll(
      `.${listItemClassName}`,
    )

    listElements?.forEach((element) => {
      if (element.innerHTML.includes(timeRemainingLabel)) {
        // Update the timer while the action is executing.
        if (executionState === 'executing') {
          // Create a timer to update the time remaining for the action every 100 milliseconds.
          let timer = setInterval(() => {
            // Get the time remaining for the action's execution.
            let timeRemaining = node.execution?.timeRemaining

            // Update the time remaining element.
            element.innerHTML = `<p><u>${timeRemainingLabel}</u> ${node.execTimeRemaining}</p>`

            // Clear the timer if the action is done executing.
            if (timeRemaining && timeRemaining <= 0) {
              clearInterval(timer)
            } else if (!timeRemaining) {
              clearInterval(timer)
            }
          }, 100)

          // Clear the timer when the component is unmounted.
          return () => clearInterval(timer)
        }
      }
    })
  }, [outputRef])

  /* -- COMPUTED -- */

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
      `<li><u>${timeRemainingLabel}</u> ${node.execTimeRemaining}</li>` +
      `</ul>`,
  )

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

/**
 * Renders the message for when an action is done executing.
 */
function ExecutionDone({
  timeStamp,
  outputType,
  username,
  nodeName,
  postExecutionMessage,
}: TExecutionDone_P): JSX.Element {
  /* -- COMPUTED -- */

  /**
   * The class name for the post-execution message.
   */
  const postExecutionMessageClassName: string = compute(() =>
    outputType === 'execution-succeeded' ? 'Succeeded' : 'Failed',
  )

  /* -- RENDER -- */

  return (
    <div className='Text'>
      <span className='LineCursor'>
        [{timeStamp}] {username}@{nodeName.replaceAll(' ', '-')}:{' '}
      </span>
      <span className={postExecutionMessageClassName}>
        <RichTextOutputBox text={postExecutionMessage} />
      </span>
    </div>
  )
}

/* ---------------------------- TYPES FOR OUTPUT PANEL ---------------------------- */

/**
 * Prop type for `OutputPanel`.
 */
type TOutputPanel_P = {
  /**
   * The force to render the message(s) for.
   */
  force: ClientMissionForce
}

/**
 * Prop type for `Intro`.
 */
type TIntro_P = {
  /**
   * The time stamp for the message.
   */
  timeStamp: string
  /**
   * The name of the force.
   */
  forceName: ClientMissionForce['name']
  /**
   * The mission's intro message.
   */
  introMessage: TClientIntro['introMessage']
}

/**
 * Prop type for `PreExecution`.
 */
type TPreExecution_P = {
  /**
   * The time stamp for the message.
   */
  timeStamp: string
  /**
   * The username of the user who is the source of the message.
   */
  username: TClientPreExecution['username']
  /**
   * The name of the node.
   */
  nodeName: TClientPreExecution['nodeName']
  /**
   * The pre-execution message to display.
   */
  preExecutionMessage: TClientPreExecution['preExecutionMessage']
}

/**
 * Prop type for `ExecutionStarted`.
 */
type TExecutionStarted_P = {
  /**
   * The node that the action is being executed on.
   */
  node: ClientMissionNode
  /**
   * The time stamp for the message.
   */
  timeStamp: string
  /**
   * The username of the user who is the source of the message.
   */
  username: TClientExecutionStarted['username']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TClientExecutionStarted['nodeName']
  /**
   * The name of the action that is being executed.
   */
  actionName: TClientExecutionStarted['actionName']
  /**
   * The time it will take to execute the action.
   */
  processTime: TClientExecutionStarted['processTime']
  /**
   * The chance of success for the action.
   */
  successChance: TClientExecutionStarted['successChance']
  /**
   * The cost of resources to execute the action.
   */
  resourceCost: TClientExecutionStarted['resourceCost']
}

/**
 * Prop type for `ExecutionDone`.
 */
type TExecutionDone_P = {
  /**
   * The time stamp for the message.
   */
  timeStamp: string
  /**
   * The output's type.
   */
  outputType: TClientOutput['type']
  /**
   * The username of the user who is the source of the message.
   */
  username:
    | TClientExecutionSucceeded['username']
    | TClientExecutionFailed['username']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName:
    | TClientExecutionSucceeded['nodeName']
    | TClientExecutionFailed['nodeName']
  /**
   * The post-execution message to display.
   */
  postExecutionMessage:
    | TClientExecutionSucceeded['postExecutionSuccessMessage']
    | TClientExecutionFailed['postExecutionFailureMessage']
}
