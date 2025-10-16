import './TimelineNoItems.scss'

/**
 * Notifies the user that their are no effects assigned
 * to a given section.
 */
export function TimelineNoItems(): JSX.Element {
  return (
    <div className='TimelineItemLike TimelineNoItems'>
      <div className='TimelineItemCell'>
        <div className='ItemName'>None scheduled...</div>
      </div>
      <div className='TimelineItemCell TimelineItemOptions' />
    </div>
  )
}
