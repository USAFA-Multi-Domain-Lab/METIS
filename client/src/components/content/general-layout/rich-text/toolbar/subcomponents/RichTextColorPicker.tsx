import Tooltip from '@client/components/content/communication/Tooltip'
import { compute } from '@client/toolbox'
import { Mission } from '@shared/missions/Mission'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useRichTextContext } from '../../RichText'
import {
  getActiveFontColor,
  getColorName,
  normalizeColor,
  toggleFontColor,
} from '../helpers/font-color'
import { useRichTextToolbarContext } from '../RichTextToolbar'
import './RichTextColorPicker.scss'

/**
 * Color picker panel for the {@link RichText} toolbar.
 * Renders a swatch for each approved METIS color.
 */
export default function RichTextColorPicker(): TReactElement | null {
  const { editor } = useRichTextContext()
  const { state } = useRichTextToolbarContext()
  const [activePicker, setActivePicker] = state.activePicker
  const [containerWidth] = state.containerWidth

  /* -- FUNCTIONS -- */

  /**
   * Generates the class name for a color swatch.
   * @param color The color of the swatch.
   * @returns The class name for the swatch.
   */
  const generateClassName = (color: string) =>
    new ClassList('ColorSwatch').set(
      'Selected',
      !!activeColor && normalizeColor(color) === normalizeColor(activeColor),
    ).value

  /* -- COMPUTED -- */

  /**
   * The CSS styling for the color picker panel.
   */
  const style = compute<React.CSSProperties>(() => {
    let style: React.CSSProperties = {}
    if (containerWidth > 0) style.maxWidth = containerWidth
    return style
  })

  /**
   * The active color for the current selection.
   */
  const activeColor = getActiveFontColor(editor)

  /* -- RENDER -- */

  if (activePicker !== 'color') return null

  return (
    <div className='ColorPicker' style={style}>
      {Mission.COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type='button'
          className={generateClassName(color)}
          style={{ backgroundColor: color }}
          aria-label={`${getColorName(color)} font color`}
          onClick={() => {
            toggleFontColor(editor, color)
            setActivePicker(null)
          }}
        >
          <Tooltip description={`**${getColorName(color)}**`} />
        </button>
      ))}
    </div>
  )
}
