import React from 'react'
import './TimelineItemCell.scss'

/**
 * A cell within a timeline item.
 */
export function TimelineItemCell({
  children,
  className,
  rootRef,
  onMouseDown,
}: TTimelineItemCell_P): JSX.Element {
  return (
    <div
      className={`TimelineItemCell ${className || ''}`}
      ref={rootRef}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  )
}

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
   * Handles a mouse-down event on the cell.
   */
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void
}
