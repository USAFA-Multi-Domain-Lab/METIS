import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import type { ButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/engines'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'

// ! Styling in Entry.scss.

/**
 * A shared header panel for mission entry sections, displaying a heading
 * alongside a panel of SVG action buttons.
 */
export default function EntryHeader({
  heading,
  engine = useButtonSvgEngine({ elements: [] }),
}: TEntryHeader_P): TReactElement {
  return (
    <div className='EntryHeader'>
      <div className='EntryHeading'>{heading}</div>
      <ButtonSvgPanel engine={engine} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link EntryHeader}.
 */
type TEntryHeader_P = {
  /**
   * The heading text displayed on the left side of the panel.
   */
  heading: string
  /**
   * The button engine powering the SVG buttons on the right.
   * If none is provided, an empty button panel will be displayed.
   */
  engine?: ButtonSvgEngine
}
