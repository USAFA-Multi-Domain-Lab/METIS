import Tooltip from '@client/components/content/communication/Tooltip'
import { compute, getOs } from '@client/toolbox'
import { getIconPath } from '@client/toolbox/icons'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useRichTextContext } from '../RichText'
import './RichTextAlignPicker.scss'

/**
 * The alignment options for the {@link RichTextAlignPicker} component.
 */
export const ALIGN_OPTIONS: TAlignOption[] = [
  {
    value: 'left',
    icon: 'align-left',
    label: 'Align Left',
    mac: '`cmd+shift+l`',
    windows: '`ctrl+shift+l`',
  },
  {
    value: 'center',
    icon: 'align-center',
    label: 'Align Center',
    mac: '`cmd+shift+e`',
    windows: '`ctrl+shift+e`',
  },
  {
    value: 'right',
    icon: 'align-right',
    label: 'Align Right',
    mac: '`cmd+shift+r`',
    windows: '`ctrl+shift+r`',
  },
  {
    value: 'justify',
    icon: 'align-justify',
    label: 'Justify',
    mac: '`cmd+shift+j`',
    windows: '`ctrl+shift+j`',
  },
]

/**
 * Alignment picker panel for the {@link RichText} bubble toolbar.
 * Renders left, center, right, and justify alignment options.
 */
export default function RichTextAlignPicker(): TReactElement | null {
  const { editor, state } = useRichTextContext()
  const [isAlignPickerOpen, setIsAlignPickerOpen] = state.isAlignPickerOpen
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

  if (!isAlignPickerOpen) return null

  return (
    <div className='AlignPicker' style={style}>
      {ALIGN_OPTIONS.map(({ value, icon, label, mac, windows }) => (
        <button
          key={value}
          type='button'
          className={generateClassName(value)}
          onClick={() => {
            editor.commands.toggleTextAlign(value)
            setIsAlignPickerOpen(false)
          }}
        >
          <img src={getIconPath(icon)} alt={label} />
          <Tooltip
            description={`**${label}**\n${getOs() === 'windows' ? windows : mac}`}
          />
        </button>
      ))}
    </div>
  )
}

/* -- TYPES --*/

/**
 * The alignment option type for the {@link RichTextAlignPicker} component.
 */
type TAlignOption = {
  /**
   * The alignment value.
   */
  value: string
  /**
   * The icon for the alignment option.
   */
  icon: TMetisIcon
  /**
   * The label for the alignment option.
   */
  label: string
  /**
   * The keyboard shortcut for macOS.
   */
  mac: string
  /**
   * The keyboard shortcut for Windows.
   */
  windows: string
}
