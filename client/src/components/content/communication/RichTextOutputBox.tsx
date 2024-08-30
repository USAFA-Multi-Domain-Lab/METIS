import ReactQuill from 'react-quill'
import './RichTextOutputBox.scss'

/**
 * Displays rich text.
 */
export default function RichTextOutputBox({
  text,
}: TRichTextOutputBox_P): JSX.Element {
  return (
    <ReactQuill
      value={text}
      readOnly={true}
      className='RichTextOutputBox'
      theme='bubble'
      modules={{
        toolbar: false,
      }}
    />
  )
}

/* ---------------------------- TYPES FOR RICH TEXT OUTPUT BOX ---------------------------- */

/**
 * Prop type for`RichTextOutputBox`.
 */
type TRichTextOutputBox_P = {
  /**
   * The HTML element (wrapped in a string) to be displayed.
   */
  text: string
}
