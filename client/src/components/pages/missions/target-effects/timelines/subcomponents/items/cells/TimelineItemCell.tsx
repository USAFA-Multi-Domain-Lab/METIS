import React from 'react'
import { compute } from 'src/toolbox'
import ClassList from '../../../../../../../../../../shared/toolbox/html/ClassList'
import './TimelineItemCell.scss'

/**
 * A cell within a timeline item.
 */
export function TimelineItemCell({
  children,
  className = '',
  rootRef,
  onClick,
  onDoubleClick,
  onMouseDown,
}: TTimelineItemCell_P): TReactElement {
  /* -- COMPUTED -- */

  /**
   * Classes for the root element of the component.
   */
  const rootClasses = compute<ClassList>(() => {
    return new ClassList('TimelineItemCell').set(className, className)
  })

  /* -- RENDER -- */

  return (
    <div
      className={rootClasses.value}
      ref={rootRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  )
}

/**
 * Props for {@link TimelineItemCell}.
 */
export type TTimelineItemCell_P = {
  /**
   * The content to display in the cell.
   */
  children?: React.ReactNode
  /**
   * Additional CSS classes to apply to the cell.
   */
  className?: string
  /**
   * A ref to the root element of the cell.
   */
  rootRef?: React.Ref<HTMLDivElement>
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event
   */
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event
   */
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void
}
