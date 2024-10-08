import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import { TList_P } from './List'
import ListColumnLabels from './ListColumnLabels'
import ListItem, { TListItem } from './ListItem'
import './ListPage.scss'

/**
 * Represents a page or grouping of items in a list.
 */
export default function ListPage<TItem extends TListItem>({
  items,
  itemsPerPage = 10,
  itemButtons,
  getItemTooltip = () => '',
  getItemButtonTooltip = () => '',
  onSelection,
  onItemButtonClick,
}: TListPage_P<TItem>): JSX.Element | null {
  /**
   * The JSX for the list items.
   */
  const itemsJsx = compute<ReactNode>(() => {
    let result = []

    // If there are items, render them.
    if (items.length > 0) {
      result = items.map((item) => (
        <ListItem
          key={item._id}
          item={item}
          buttons={itemButtons}
          getItemTooltip={getItemTooltip}
          getItemButtonTooltip={getItemButtonTooltip}
          onSelection={onSelection}
          onButtonClick={onItemButtonClick}
        />
      ))
    }
    // Else, render a message indicating that
    // there are no items.
    else {
      result.push(
        <div className='NoItems ListItemLike' key='no-items'>
          <div className='ItemName ItemCell'>None available...</div>
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
      <ListColumnLabels itemButtonCount={itemButtons?.length ?? 0} />
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
  /**
   * The number of items to display per page.
   */
  itemsPerPage: number
  /**
   * The buttons to display for each item.
   */
  itemButtons: TList_P<TItem>['itemButtons']
  /**
   * Gets the tooltip description for the item.
   * @param item The item for which to get the tooltip.
   * @returns The tooltip description.
   * @default () => ''
   */
  getItemTooltip?: TList_P<TItem>['getItemTooltip']
  /**
   * Gets the tooltip description for the item's button.
   * @param button The button for which to get the tooltip.
   * @param item The item for which to get the tooltip.
   * @default () => ''
   */
  getItemButtonTooltip?: TList_P<TItem>['getItemButtonTooltip']
  /**
   * The callback for when an item is selected.
   */
  onSelection?: TList_P<TItem>['onSelection']
  /**
   * The callback for when an item button is clicked.
   */
  onItemButtonClick?: TList_P<TItem>['onItemButtonClick']
}
