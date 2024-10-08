import ListFiltering from './ListFiltering'
import { TListItem } from './ListItem'
import './ListNav.scss'
import ListPageControls from './ListPageControls'

export default function ListNav<TItem extends TListItem>({
  headingText,
  pageNumberState,
  pageCount,
  items,
  filteredItemsState,
}: TListNav_P<TItem>): JSX.Element | null {
  // Render the nav.
  return (
    <div className='ListNav'>
      <div className='ListHeader'>
        <div className='ListHeading'>{headingText}</div>
      </div>
      <ListPageControls
        pageNumberState={pageNumberState}
        pageCount={pageCount}
      />
      <ListFiltering items={items} filteredItemsState={filteredItemsState} />
    </div>
  )
}

/**
 * Props for `ListNav`.
 */
export type TListNav_P<TItem extends TListItem> = {
  /**
   * The text to display in the heading.
   */
  headingText: string
  /**
   * The state for the current page number.
   */
  pageNumberState: [number, TReactSetter<number>]
  /**
   * The number of pages in the list.
   */
  pageCount: number
  /**
   * The original unfiltered list of items.
   */
  items: TItem[]
  /**
   * The state for the filtered items.
   */
  filteredItemsState: TReactState<TItem[]>
}
