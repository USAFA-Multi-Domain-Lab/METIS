import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import { useListContext } from '../List'
import ListColumnLabels from './ListColumnLabels'
import ListItem, { TListItem } from './ListItem'
import './ListPage.scss'

/**
 * Represents a page or grouping of items in a list.
 */
export default function ListPage<TItem extends TListItem>({
  items,
}: TListPage_P<TItem>): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const { itemButtons, getColumnWidth, getColumnLabel } = listContext
  const [itemsPerPage] = listContext.state.itemsPerPage
  const [visibleColumns] = listContext.state.visibleColumns

  /* -- RENDER -- */

  /**
   * The JSX for the list items.
   */
  const itemsJsx = compute<ReactNode>(() => {
    let result = []

    // If there are items, render them.
    if (items.length > 0) {
      result = items.map((item) => <ListItem key={item._id} item={item} />)
    }
    // Else, render a message indicating that
    // there are no items.
    else {
      result.push(
        <div className='NoItems ListItemLike' key='no-items'>
          <div className='ItemName ItemCellLike'>None available...</div>
        </div>,
      )
    }

    // While there are less items than the number of items
    // per page, add empty items to the list.
    while (result.length < itemsPerPage) {
      result.push(
        <div
          key={`blank_${result.length}`}
          className='ItemBlank ListItemLike'
        ></div>,
      )
    }

    return result
  })

  // Render the page.
  return (
    <div className='ListPage'>
      <ListColumnLabels<TItem> />
      <div className='ListItems'>{itemsJsx}</div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `ListPage`.
 */
export type TListPage_P<TItem extends TListItem> = {
  /**
   * The items to display on the page.
   */
  items: TItem[]
}
