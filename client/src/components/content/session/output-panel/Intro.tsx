import ClientIntroOutput from 'src/missions/forces/outputs/intro'
import { compute } from 'src/toolbox'
import RichTextOutputBox from '../../communication/RichTextOutputBox'

/**
 * Renders the intro message for the force.
 */
export default function Intro({
  output: { time, forceName, message },
}: TIntro_P): JSX.Element {
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
  return (
    <div className='Text'>
      <span className='LineCursor Intro'>
        [{timeStamp}] {forceName.replaceAll(' ', '-')}:{' '}
      </span>
      <RichTextOutputBox text={message} />
    </div>
  )
}

/* ---------------------------- TYPES FOR INTRO ---------------------------- */

/**
 * Prop type for `Intro`.
 */
type TIntro_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientIntroOutput
}
