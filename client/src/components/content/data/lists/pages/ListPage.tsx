import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import { MetisComponent } from '../../../../../../../shared'
import { useListContext } from '../List'
import ListUpload from '../uploads'
import ListItem from './items/ListItem'
import ListItemUpload from './items/ListItemUpload'
import ListColumnLabels from './ListColumnLabels'
import './ListPage.scss'

/**
 * Represents a page or grouping of items in a list.
 */
export default function ListPage<TItem extends MetisComponent>({
  items,
}: TListPage_P<TItem>): TReactElement | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const uploads = listContext.uploads
  const [itemsPerPage] = listContext.state.itemsPerPage
  const [_, setSelection] = listContext.state.selection

  /* -- FUNCTIONS -- */

  /**
   * Callback for when a item blank is clicked.
   */
  const onItemBlankClick = () => setSelection(null)

  /* -- RENDER -- */

  /**
   * The JSX for the list items.
   */
  const itemsJsx = compute<ReactNode>(() => {
    let result = []

    // If there are items, render them.
    if (items.length > 0) {
      result.push(
        ...items.map((item) => {
          if (item instanceof ListUpload) {
            return <ListItemUpload key={item._id} upload={item} />
          } else {
            return <ListItem key={item._id} item={item} />
          }
        }),
      )
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
          onClick={onItemBlankClick}
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
export type TListPage_P<TItem extends MetisComponent> = {
  /**
   * The items to display on the page.
   */
  items: Array<TItem | ListUpload>
}
