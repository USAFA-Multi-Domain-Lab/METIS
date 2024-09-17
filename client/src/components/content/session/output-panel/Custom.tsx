import ClientCustomOutput from 'src/missions/forces/outputs/custom'
import { compute } from 'src/toolbox'
import RichTextOutputBox from '../../communication/RichTextOutputBox'

/**
 * Renders the custom message generated from the action's effect.
 */
export default function Custom({
  output: { time, username, message },
}: TCustom_P): JSX.Element | null {
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
        [{timeStamp}] {username}: {/* @{nodeName.replaceAll(' ', '-')}:{' '} */}
      </span>
      <RichTextOutputBox text={message} />
    </div>
  )
}

/* ---------------------------- TYPES FOR CUSTOM ---------------------------- */

/**
 * Prop type for `Custom`.
 */
type TCustom_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientCustomOutput
}
