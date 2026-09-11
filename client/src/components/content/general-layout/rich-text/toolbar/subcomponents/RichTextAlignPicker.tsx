import Tooltip from '@client/components/content/communication/Tooltip'
import { compute } from '@client/toolbox'
import { getIconPath } from '@client/toolbox/icons'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useRichTextContext } from '../../RichText'
import { ALIGN_OPTIONS } from '../helpers/text-align'
import { useRichTextToolbarContext } from '../RichTextToolbar'
import './RichTextAlignPicker.scss'

/**
 * Alignment picker panel for the RichText toolbar.
 * Renders left, center, right, and justify alignment options.
 */
export default function RichTextAlignPicker(): TReactElement | null {
  const { editor } = useRichTextContext()
  const { state } = useRichTextToolbarContext()
  const [activePicker, setActivePicker] = state.activePicker
  const [containerWidth] = state.containerWidth

  /* -- FUNCTIONS -- */

  /**
   * Generates the class name for an alignment button.
   * @param value The alignment value.
   */
  const generateClassName = (value: string) =>
    new ClassList('AlignButton').set(
      'Selected',
      editor.isActive({ textAlign: value }),
    ).value

  /**
   * Writes the description for an alignment button's tooltip.
   * @param label The alignment label.
   * @param keystrokeLabel The keystroke label.
   * @returns The tooltip description.
   */
  const writeTooltipDescription = (label: string, keystrokeLabel: string) =>
    `**${label}**\n` + `\`${keystrokeLabel}\``

  /* -- COMPUTED -- */

  /**
   * The CSS styling for the alignment picker panel.
   */
  const style = compute<React.CSSProperties>(() => {
    let style: React.CSSProperties = {}
    if (containerWidth > 0) style.maxWidth = containerWidth
    return style
  })

  /* -- RENDER -- */

  if (activePicker !== 'align') return null

  return (
    <div className='AlignPicker' style={style}>
      {ALIGN_OPTIONS.map(({ value, icon, label, keystrokeLabel }) => (
        <button
          key={value}
          type='button'
          className={generateClassName(value)}
          onClick={() => {
            editor.commands.toggleTextAlign(value)
            setActivePicker(null)
          }}
        >
          <img src={getIconPath(icon)} alt={label} />
          <Tooltip
            description={writeTooltipDescription(label, keystrokeLabel)}
          />
        </button>
      ))}
    </div>
  )
}
