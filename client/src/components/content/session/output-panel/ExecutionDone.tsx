import ClientExecutionFailedOutput from 'src/missions/forces/outputs/execution-failed'
import ClientExecutionSucceededOutput from 'src/missions/forces/outputs/execution-succeeded'
import { compute } from 'src/toolbox'
import RichTextOutputBox from '../../communication/RichTextOutputBox'

/**
 * Renders the message for when an action is done executing.
 */
export default function ExecutionDone({
  output: { time, type, username, nodeName, message },
}: TExecutionDone_P): JSX.Element | null {
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
   * The class name for the post-execution message.
   */
  const postExecutionMessageClassName: string = compute(() =>
    type === 'execution-succeeded' ? 'Succeeded' : 'Failed',
  )

  /* -- RENDER -- */
  return (
    <div className='Text'>
      <span className='LineCursor'>
        [{timeStamp}] {username}@{nodeName.replaceAll(' ', '-')}:{' '}
      </span>
      <span className={postExecutionMessageClassName}>
        <RichTextOutputBox text={message} />
      </span>
    </div>
  )
}

/* ---------------------------- TYPES FOR EXECUTION DONE ---------------------------- */

/**
 * Prop type for `ExecutionDone`.
 */
type TExecutionDone_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientExecutionSucceededOutput | ClientExecutionFailedOutput
}
