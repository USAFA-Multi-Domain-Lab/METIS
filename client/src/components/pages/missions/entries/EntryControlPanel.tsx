import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import type { ButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/engines'

// ! Styling in Entry.scss.

/**
 * A shared header panel for mission entry sections, displaying a heading
 * alongside a panel of SVG action buttons.
 */
export default function EntryControlPanel({
  heading,
  engine,
}: TEntryControlPanel_P): TReactElement {
  return (
    <div className='EntryControlPanel'>
      <div className='EntryControlPanelHeading'>{heading}</div>
      <ButtonSvgPanel engine={engine} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link EntryControlPanel}.
 */
type TEntryControlPanel_P = {
  /**
   * The heading text displayed on the left side of the panel.
   */
  heading: string
  /**
   * The button engine powering the SVG buttons on the right.
   */
  engine: ButtonSvgEngine
}
