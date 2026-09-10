import Tooltip from '@client/components/content/communication/Tooltip'
import { compute } from '@client/toolbox'
import { writeKeystrokeLabel } from '@client/toolbox/keyboard'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { RichTextToolbox } from '@shared/toolbox/rich-text/RichTextToolbox'
import type { Level } from '@tiptap/extension-heading'
import { useRichTextContext } from '../../RichText'
import { HEADING_LEVELS } from '../helpers/heading'
import { useRichTextToolbarContext } from '../RichTextToolbar'
import './RichTextHeadingPicker.scss'

/**
 * Heading picker panel for the {@link RichText} toolbar.
 * Renders H1–H6 buttons for applying heading levels to the current block.
 */
export default function RichTextHeadingPicker(): TReactElement | null {
  const { editor } = useRichTextContext()
  const { state } = useRichTextToolbarContext()
  const [activePicker, setActivePicker] = state.activePicker
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

  /**
   * Writes the description for a heading button's tooltip.
   * @param level The heading level.
   * @returns The tooltip description.
   */
  const writeTooltipDescription = (level: Level) => {
    const shortcut: string = writeKeystrokeLabel({
      keys: String(level),
      usesModifier: true,
      usesAlt: true,
    })

    return (
      `**Heading ${level}**` +
      `${RichTextToolbox.MARKDOWN_LINE_BREAK}` +
      `\`${shortcut}\``
    )
  }

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

  if (activePicker !== 'heading') return null

  return (
    <div className='HeadingPicker' style={style}>
      {HEADING_LEVELS.map((level) => (
        <button
          key={level}
          type='button'
          className={generateClassName(level)}
          onClick={() => {
            editor.commands.toggleHeading({ level })
            setActivePicker(null)
          }}
        >
          H{level}
          <Tooltip description={writeTooltipDescription(level)} />
        </button>
      ))}
    </div>
  )
}
