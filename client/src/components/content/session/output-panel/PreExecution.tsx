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

  /**
   * The class name for the text.
   */
  const textClassName: string = compute(() => {
    // Class list for the text.
    let classList: string[] = ['Text']

    // Hide the message if it is empty.
    if (message === '') {
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
      <RichTextOutputBox text={message} />
    </div>
  )
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
