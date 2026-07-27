import Tooltip from '@client/components/content/communication/Tooltip'
import { compute, getOs } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { Level } from '@tiptap/extension-heading'
import { useRichTextContext } from '../RichText'
import './RichTextHeadingPicker.scss'

export const HEADING_LEVELS: Level[] = [1, 2, 3, 4, 5, 6]

/**
 * Heading picker panel for the {@link RichText} bubble toolbar.
 * Renders H1–H6 buttons for applying heading levels to the current block.
 */
export default function RichTextHeadingPicker(): TReactElement | null {
  const { editor, state } = useRichTextContext()
  const [isHeadingPickerOpen, setIsHeadingPickerOpen] =
    state.isHeadingPickerOpen
  const [containerWidth] = state.containerWidth

  /* -- FUNCTIONS -- */

  /**
   * Generates the class name for a heading button.
   * @param level The heading level.
   */
  const generateClassName = (level: Level) =>
    new ClassList('HeadingButton').set(
      'Selected',
      editor.isActive('heading', { level }),
    ).value

  /* -- COMPUTED -- */

  /**
   * The CSS styling for the heading picker panel.
   */
  const style = compute<React.CSSProperties>(() => {
    let style: React.CSSProperties = {}
    if (containerWidth > 0) style.maxWidth = containerWidth
    return style
  })

  /* -- RENDER -- */

  if (!isHeadingPickerOpen) return null

  return (
    <div className='HeadingPicker' style={style}>
      {HEADING_LEVELS.map((level) => (
        <button
          key={level}
          type='button'
          className={generateClassName(level)}
          onClick={() => {
            editor.commands.toggleHeading({ level })
            setIsHeadingPickerOpen(false)
          }}
        >
          H{level}
          <Tooltip
            description={`**Heading ${level}**\n${getOs() === 'windows' ? `\`ctrl+alt+${level}\`` : `\`cmd+opt+${level}\``}`}
          />
        </button>
      ))}
    </div>
  )
}
