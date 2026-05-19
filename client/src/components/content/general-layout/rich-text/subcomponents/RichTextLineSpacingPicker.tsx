import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useRichTextContext } from '../RichText'
import './RichTextLineSpacingPicker.scss'

/**
 * The line height options for the {@link RichTextLineSpacingPicker} component.
 */
export const LINE_HEIGHT_OPTIONS = ['1', '1.5', '2', '2.5', '3']

/**
 * Line spacing picker panel for the {@link RichText} bubble toolbar.
 * Renders line height options from 1x to 3x.
 */
export default function RichTextLineSpacingPicker(): TReactElement | null {
  const { editor, state } = useRichTextContext()
  const [isLineSpacingPickerOpen, setIsLineSpacingPickerOpen] =
    state.isLineSpacingPickerOpen
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
  const activeLineHeight = compute<string | undefined>(() => {
    return editor.getAttributes('textStyle').lineHeight
  })

  /* -- RENDER -- */

  if (!isLineSpacingPickerOpen) return null

  return (
    <div className='LineSpacingPicker' style={style}>
      {LINE_HEIGHT_OPTIONS.map((value) => (
        <div
          key={value}
          className={generateClassName(value)}
          onClick={() => {
            if (activeLineHeight === value) {
              editor.commands.unsetLineHeight()
            } else {
              editor.commands.setLineHeight(value)
            }
            setIsLineSpacingPickerOpen(false)
          }}
        >
          {value}x
        </div>
      ))}
    </div>
  )
}
