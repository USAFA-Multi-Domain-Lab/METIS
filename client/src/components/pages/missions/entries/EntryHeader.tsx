import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import type { ButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/engines'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import {
  ClassList,
  type TAdditionalClassesSupport,
} from '@shared/toolbox/html/ClassList'
import type { TRootElementRefSupport } from '@shared/toolbox/html/elements'
import React from 'react'
import './EntryHeader.scss'

/**
 * A shared header panel for mission entry sections, displaying a heading
 * alongside a panel of SVG action buttons.
 */
export default function EntryHeader({
  heading,
  engine = useButtonSvgEngine({ elements: [] }),
  additionalClasses = new ClassList(),
  elementRef = React.createRef<HTMLDivElement>(),
}: TEntryHeader_P): TReactElement {
  let classList = new ClassList('EntryHeader').import(additionalClasses)

  return (
    <div className={classList.value} ref={elementRef}>
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
} & TAdditionalClassesSupport &
  TRootElementRefSupport
