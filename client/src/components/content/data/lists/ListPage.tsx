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
  columns = [],
  itemsPerPage = 10,
  itemButtons,
  getColumnLabel = (x) => x.toString(),
  getCellText = (item, column) => (item[column] as any).toString(),
  getItemTooltip = () => '',
  getItemButtonTooltip = () => '',
  getColumnWidth = () => '10em',
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
          columns={columns}
          buttons={itemButtons}
          getCellText={getCellText}
          getItemTooltip={getItemTooltip}
          getItemButtonTooltip={getItemButtonTooltip}
          getColumnWidth={getColumnWidth}
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
      <ListColumnLabels<TItem>
        columns={columns}
        itemButtonCount={itemButtons?.length ?? 0}
        getColumnLabel={getColumnLabel}
        getColumnWidth={getColumnWidth}
      />
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
   * Additional columns to display for each item.
   * @default []
   */
  columns: TList_P<TItem>['columns']
  /**
   * The number of items to display per page.
   */
  itemsPerPage: number
  /**
   * The buttons to display for each item.
   */
  itemButtons: TList_P<TItem>['itemButtons']
  /**
   * Gets the column label for the item.
   * @param column The column for which to get the label.
   * @returns The column label.
   * @default (x) => x.toString()
   */
  getColumnLabel?: TList_P<TItem>['getColumnLabel']
  /**
   * Gets the text for a list item cell.
   * @param item The item for which to get the text.
   * @param column The column for which to get the text.
   * @returns The text to display in the cell.
   * @default () => (item[column] as any).toString()
   */
  getCellText?: TList_P<TItem>['getCellText']
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
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   * @default () => '10em'
   */
  getColumnWidth?: TList_P<TItem>['getColumnWidth']
  /**
   * The callback for when an item is selected.
   */
  onSelection?: TList_P<TItem>['onSelection']
  /**
   * The callback for when an item button is clicked.
   */
  onItemButtonClick?: TList_P<TItem>['onItemButtonClick']
}
