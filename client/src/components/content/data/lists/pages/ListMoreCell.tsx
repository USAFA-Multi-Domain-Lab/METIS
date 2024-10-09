import { useListContext } from '../List'
import { TListItem } from './ListItem'
import './ListMoreCell.scss'

/**
 * Shows more details for a list item, namely the
 * columns that are hidden due to space constraints.
 */
export default function ListMoreCell<T extends TListItem>({
  item,
}: TListMoreCell_P<T>): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<T>()

  /* -- RENDER -- */

  // Render the cell.
  return <div className={'ListMoreCell ItemCellLike'}></div>
}

/**
 * Props for `ListItem`.
 */
export type TListMoreCell_P<T extends TListItem> = {
  /**
   * The item which is the row the cell is in.
   */
  item: T
}
