import ClientPreExecutionOutput from 'src/missions/forces/outputs/pre-execution'
import { compute } from 'src/toolbox'
import RichTextOutputBox from '../../communication/RichTextOutputBox'

/**
 * Renders the pre-execution message for a selected node.
 */
export default function PreExecution({
  output: { time, username, nodeName, message },
}: TPreExecution_P): JSX.Element | null {
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

  /* -- RENDER -- */

  if (!!message) {
    return (
      <div className='Text'>
        <span className='LineCursor'>
          [{timeStamp}] {username}@{nodeName.replaceAll(' ', '-')}:{' '}
        </span>
        <RichTextOutputBox text={message} />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR PRE-EXECUTION ---------------------------- */

/**
 * Prop type for `PreExecution`.
 */
type TPreExecution_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientPreExecutionOutput
}
