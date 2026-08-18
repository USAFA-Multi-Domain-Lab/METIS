import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useRichTextContext } from '../../RichText'
import {
  getActiveLineHeight,
  LINE_HEIGHT_OPTIONS,
  toggleLineSpacing,
} from '../helpers/line-spacing'
import { useRichTextToolbarContext } from '../RichTextToolbar'
import './RichTextLineSpacingPicker.scss'

/**
 * Line spacing picker panel for the {@link RichText} toolbar.
 * Renders line height options from 1x to 3x.
 */
export default function RichTextLineSpacingPicker(): TReactElement | null {
  const { editor } = useRichTextContext()
  const { state } = useRichTextToolbarContext()
  const [activePicker, setActivePicker] = state.activePicker
  const [containerWidth] = state.containerWidth

  /* -- FUNCTIONS -- */

  /**
   * Generates the class name for a line height button.
   * @param value The line height value.
   */
  const generateClassName = (value: string) =>
    new ClassList('LineSpacingButton').set(
      'Selected',
      activeLineHeight === value,
    ).value

  /* -- COMPUTED -- */

  /**
   * The CSS styling for the line spacing picker panel.
   */
  const style = compute<React.CSSProperties>(() => {
    let style: React.CSSProperties = {}
    if (containerWidth > 0) style.maxWidth = containerWidth
    return style
  })

  /**
   * The active line height for the current selection.
   */
  const activeLineHeight = getActiveLineHeight(editor)

  /* -- RENDER -- */

  if (activePicker !== 'line-spacing') return null

  return (
    <div className='LineSpacingPicker' style={style}>
      {LINE_HEIGHT_OPTIONS.map((value) => (
        <button
          key={value}
          type='button'
          className={generateClassName(value)}
          onClick={() => {
            toggleLineSpacing(editor, value)
            setActivePicker(null)
          }}
        >
          {value}x
        </button>
      ))}
    </div>
  )
}
