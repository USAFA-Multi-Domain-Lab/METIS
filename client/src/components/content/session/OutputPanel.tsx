import { useRef, useState } from 'react'
import RichTextOutputBox from 'src/components/content/communication/RichTextOutputBox'
import ClientMissionForce from 'src/missions/forces'
import {
  TClientExecutionFailed,
  TClientExecutionStarted,
  TClientExecutionSucceeded,
  TClientIntro,
  TClientOutputMessage,
  TClientPreExecution,
} from 'src/missions/forces/output-message'
import { compute } from 'src/toolbox'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'
import './OutputPanel.scss'

/**
 * A panel for displaying output messages in the session.
 */
export default function OutputPanel({ force }: TOutputPanel_P): JSX.Element {
  /* -- STATE -- */
  const [outputMessages, setOutputMessages] = useState<
    ClientMissionForce['outputMessages']
  >(force.outputMessages)

  /* -- EFFECTS -- */

  useEventListener(force, 'output-message', () => {
    setOutputMessages(force.outputMessages)
  })

  /* -- RENDER -- */
  return (
    <div className='OutputPanel'>
      <div className='BorderBox'>
        {outputMessages.map((outputMessage) => {
          let timeStamp: string = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(outputMessage.time)

          if (outputMessage._id === 'intro-message') {
            return (
              <IntroMessage
                timeStamp={timeStamp}
                forceName={force.name}
                introMessage={outputMessage.introMessage}
                key={`intro-message_time-stamp-${timeStamp}`}
              />
            )
          } else if (outputMessage._id === 'pre-execution') {
            return (
              <PreExecution
                timeStamp={timeStamp}
                username={outputMessage.username}
                nodeName={outputMessage.nodeName}
                preExecutionMessage={outputMessage.preExecutionMessage}
                key={`pre-execution-message_time-stamp-${timeStamp}`}
              />
            )
          } else if (outputMessage._id === 'execution-started') {
            return (
              <ExecutionStarted
                timeStamp={timeStamp}
                username={outputMessage.username}
                nodeName={outputMessage.nodeName}
                actionName={outputMessage.actionName}
                processTime={outputMessage.processTime}
                successChance={outputMessage.successChance}
                resourceCost={outputMessage.resourceCost}
                key={`action-execution-start_time-stamp-${timeStamp}`}
              />
            )
          } else if (outputMessage._id === 'execution-succeeded') {
            return (
              <ExecutionDone
                timeStamp={timeStamp}
                outputMessageId={outputMessage._id}
                username={outputMessage.username}
                nodeName={outputMessage.nodeName}
                postExecutionMessage={outputMessage.postExecutionSuccessMessage}
                key={`action-execution-succeeded_time-stamp-${timeStamp}`}
              />
            )
          } else if (outputMessage._id === 'execution-failed') {
            return (
              <ExecutionDone
                timeStamp={timeStamp}
                outputMessageId={outputMessage._id}
                username={outputMessage.username}
                nodeName={outputMessage.nodeName}
                postExecutionMessage={outputMessage.postExecutionFailureMessage}
                key={`action-execution-failed_time-stamp-${timeStamp}`}
              />
            )
          } else {
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
  /* -- REFS -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- EFFECTS -- */

  // componentDidMount
  useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = scrollRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollIntoView({ behavior: 'smooth' })
    }
    done()
  })

  /* -- RENDER -- */
  return (
    <div className='Text' ref={scrollRef}>
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
  /* -- REFS -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- EFFECTS -- */

  // componentDidMount
  useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = scrollRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollIntoView({ behavior: 'smooth' })
    }
    done()
  })

  /* -- RENDER -- */
  let textClassName: string = 'Text'

  if (preExecutionMessage === '') {
    textClassName += ' Hidden'
  }

  return (
    <div className={textClassName} ref={scrollRef}>
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
  timeStamp,
  username,
  nodeName,
  actionName,
  processTime,
  successChance,
  resourceCost,
}: TExecutionStarted_P): JSX.Element {
  /* -- REFS -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- EFFECTS -- */

  // componentDidMount
  useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = scrollRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollIntoView({ behavior: 'smooth' })
    }
    done()
  })

  /* -- RENDER -- */
  let done: boolean = false
  let processTimeFormatted: string = processTime / 1000 + ' second(s)'
  let successChanceFormatted: string = successChance * 100 + '%'
  let resourceCostFormatted: string = resourceCost + ' resource(s)'
  // todo: Fix this
  // let timeRemainingFormatted: string = ''

  // if (!done) {
  //   timeRemainingFormatted = executingNode.formatTimeRemaining(true)
  //   timeRemainingFormatted = ''

  //   if (timeRemainingFormatted === 'Done.') {
  //     done = true
  //   }
  // } else {
  //   timeRemainingFormatted = 'Done.'
  // }

  return (
    <div className='Text' ref={scrollRef}>
      <span className='LineCursor'>
        [{timeStamp}] {username}@{nodeName.replaceAll(' ', '-')}:{' '}
      </span>
      <RichTextOutputBox text={`Started executing ${nodeName}.`} />
      <ul className='SelectedActionPropertyList'>
        <li className='SelectedActionProperty'>
          <RichTextOutputBox text={`Action selected: ${actionName}`} />
        </li>
        <br></br>
        <li className='SelectedActionProperty'>
          <RichTextOutputBox
            text={`Time to execute: ${processTimeFormatted}`}
          />
        </li>
        <br></br>
        <li className='SelectedActionProperty'>
          <RichTextOutputBox
            text={`Probability of success: ${successChanceFormatted}`}
          />
        </li>
        <br></br>
        <li className='SelectedActionProperty'>
          <RichTextOutputBox text={`Resource cost: ${resourceCostFormatted}`} />
        </li>
        <br></br>
        {/* // todo: fix this */}
        {/* <li className='SelectedActionProperty'>
          <RichTextOutputBox
            Element={`Time remaining: ${timeRemainingFormatted}`}
          />
        </li> */}
        <br></br>
      </ul>
    </div>
  )
}

/**
 * Renders the message for when an action is done executing.
 */
function ExecutionDone({
  timeStamp,
  outputMessageId,
  username,
  nodeName,
  postExecutionMessage,
}: TExecutionDone_P): JSX.Element {
  /* -- REFS -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  /**
   * The class name for the post-execution message.
   */
  const postExecutionMessageClassName: string = compute(() =>
    outputMessageId === 'execution-succeeded' ? 'Succeeded' : 'Failed',
  )

  /* -- EFFECTS -- */

  // componentDidMount
  useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = scrollRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollIntoView({ behavior: 'smooth' })
    }
    done()
  })

  /* -- RENDER -- */

  return (
    <div className='Text' ref={scrollRef}>
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
   * The output message's ID.
   */
  outputMessageId: TClientOutputMessage['_id']
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
