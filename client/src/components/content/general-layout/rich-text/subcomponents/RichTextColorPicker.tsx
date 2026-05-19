import { compute } from '@client/toolbox'
import { Mission } from '@shared/missions/Mission'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useRichTextContext } from '../RichText'
import './RichTextColorPicker.scss'

/**
 * Normalizes a CSS color string to `rgb(r, g, b)` format for cross-format
 * comparison. Browsers normalize `element.style.color` to RGB when parsing
 * HTML, so a color stored as `#fd6b72` on save becomes `rgb(253, 107, 114)`
 * on reload. Passing both sides through this function makes comparisons
 * format-agnostic.
 */
export const normalizeColor = (color: string): string => {
  if (!color.startsWith('#') || color.length !== 7) return color
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Color picker panel for the {@link RichText} bubble toolbar.
 * Renders the approved METIS color swatches and a reset swatch.
 */
export default function RichTextColorPicker(): TReactElement | null {
  const { editor, state } = useRichTextContext()
  const [isColorPickerOpen, setIsColorPickerOpen] = state.isColorPickerOpen
  const [containerWidth] = state.containerWidth

  /* -- FUNCTIONS -- */

  /**
   * Generates the class name for a color swatch.
   * @param color The color of the swatch.
   * @returns The class name for the swatch.
   */
  const generateClassName = (color: string) => {
    const active = editor.getAttributes('textStyle').color as string | undefined
    return new ClassList('ColorSwatch').set(
      'Selected',
      !!active && normalizeColor(color) === normalizeColor(active),
    ).value
  }

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
  const activeColor = compute<string | undefined>(() => {
    return editor.getAttributes('textStyle').color
  })

  /* -- RENDER -- */

  if (!isColorPickerOpen) return null

  return (
    <div className='ColorPicker' style={style}>
      {Mission.COLOR_OPTIONS.map((color) => (
        <div
          key={color}
          className={generateClassName(color)}
          style={{ backgroundColor: color }}
          onClick={() => {
            if (
              activeColor &&
              normalizeColor(activeColor) === normalizeColor(color)
            ) {
              editor.commands.unsetColor()
            } else {
              editor.commands.setColor(color)
            }
            setIsColorPickerOpen(false)
          }}
        />
      ))}
    </div>
  )
}
