import { useRef, useState } from 'react'
import { compute } from 'src/toolbox'
import { TButtonSvgType } from '../../user-controls/buttons/ButtonSvg'
import { TSvgPanelOnClick } from '../../user-controls/buttons/ButtonSvgPanel_v2'
import './List.scss'
import ListButtons from './ListButtons'
import {
  TGetItemButtonTooltip,
  TGetItemTooltip,
  TListItem,
  TOnItemButtonClick,
  TOnItemSelection,
} from './ListItem'
import ListNav from './ListNav'
import ListPage, { TListPage_P } from './ListPage'
import ListResizeHandler from './ListResizeHandler'

/**
 * Displays a list of items of the given type.
 */
export default function List<TItem extends TListItem>({
  name,
  items,
  columns = [],
  itemsPerPageMin = 10,
  listButtons = [],
  itemButtons = [],
  getColumnLabel = (x) => x.toString(),
  getCellText = (item, column) => (item[column] as any).toString(),
  getItemTooltip = () => '',
  getListButtonTooltip = () => '',
  getItemButtonTooltip = () => '',
  getColumnWidth = () => '10em',
  onSelection = () => {},
  onListButtonClick = () => {},
  onItemButtonClick = () => {},
}: TList_P<TItem>): JSX.Element | null {
  /* -- STATE -- */

  // The current page number to
  // display in the list.
  const [pageNumber, setPageNumber] = useState<number>(0)
  // The items after filtering is applied.
  const [filteredItems, setFilteredItems] = useState<TItem[]>(items)
  // Calculated amount of items per page
  // in the event that itemsPerPage is
  // set to 'auto'.
  const [itemsPerPage, setItemsPerPage] = useState<number>(itemsPerPageMin)
  // Reference to the root element.
  const root = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  /**
   * The computed pages of items in the list
   * based on the items passed and the number
   * of items per page configured.
   */
  const pages = compute<TListPage_P<TItem>[]>(() => {
    const results: Required<TListPage_P<TItem>>[] = []

    for (
      let i = 0;
      i < filteredItems.length || !results.length;
      i += itemsPerPage
    ) {
      results.push({
        items: filteredItems.slice(i, i + itemsPerPage),
        columns,
        itemsPerPage: itemsPerPage,
        itemButtons,
        getCellText,
        getColumnLabel,
        getItemTooltip,
        getItemButtonTooltip,
        getColumnWidth,
        onSelection,
        onItemButtonClick,
      })
    }

    return results
  })

  /**
   * The current page of items to display.
   */
  const currentPageJsx = compute<JSX.Element | null>(() => {
    // Get the current page's props.
    let currentPage: TListPage_P<TItem> | undefined = pages[pageNumber]

    // If there is no current page, return null.
    if (!currentPage) return null

    // Render the current page.
    return <ListPage key={`page_${pageNumber}`} {...currentPage} />
  })

  /**
   * The current number of pages in the list.
   */
  const pageCount = compute<number>(() => pages.length)

  /* -- RENDER -- */

  // Render the list.
  return (
    <div className={'List'} ref={root}>
      <ListNav
        headingText={name}
        pageNumberState={[pageNumber, setPageNumber]}
        pageCount={pageCount}
        items={items}
        filteredItemsState={[filteredItems, setFilteredItems]}
      />
      {currentPageJsx}
      <ListButtons
        buttons={listButtons}
        getButtonTooltip={getListButtonTooltip}
        onButtonClick={onListButtonClick}
      />
      <ListResizeHandler
        list={root}
        itemsPerPageState={[itemsPerPage, setItemsPerPage]}
        pageNumberState={[pageNumber, setPageNumber]}
      />
    </div>
  )
}

/**
 * Props for `List`.
 */
export type TList_P<TItem extends TListItem> = {
  /**
   * The name of the list.
   */
  name: string
  /**
   * The items to display in the list.
   */
  items: TItem[]
  /**
   * Additional columns to display in the list.
   * @default []
   */
  columns?: TListColumnType<TItem>[]
  /**
   * The minimum number of items to display per page.
   * @note More items will be displayed if there is
   * enough space in the list.
   * @default 10
   */
  itemsPerPageMin?: number
  /**
   * The list-specific buttons to display, which when clicked,
   * will perform an action not specific to any item in the list.
   * @default []
   */
  listButtons?: TButtonSvgType[]
  /**
   * The item-specific buttons to display, which when clicked,
   * will perform an action specific to an item in the list.
   * @default []
   */
  itemButtons?: TButtonSvgType[]
  /**
   * Gets the tooltip description for the item.
   * @param item The item for which to get the tooltip.
   * @returns The tooltip description.
   * @default () => ''
   */
  getItemTooltip?: TGetItemTooltip<TItem>
  /**
   * Gets the column label for the given column.
   * @param column The column for which to get the label.
   * @returns The column label.
   * @default (x) => x.toString()
   */
  getColumnLabel?: (column: TListColumnType<TItem>) => string
  /**
   * Gets the text for a list item cell.
   * @param item The item for which to get the text.
   * @param column The column for which to get the text.
   * @returns The text to display in the cell.
   * @default () => (item[column] as any).toString()
   */
  getCellText?: (item: TItem, column: TListColumnType<TItem>) => string
  /**
   * Gets the tooltip description for a list button.
   * @param button The button for which to get the tooltip.
   * @returns The tooltip description.
   * @default () => ''
   */
  getListButtonTooltip?: TGetListButtonTooltip
  /**
   * Gets the tooltip description for the item's button.
   * @param button The button for which to get the tooltip.
   * @param item The item for which to get the tooltip.
   * @default () => ''
   */
  getItemButtonTooltip?: TGetItemButtonTooltip<TItem>
  /**
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   * @default () => '10em'
   */
  getColumnWidth?: (column: TListColumnType<TItem>) => string
  /**
   * A callback for when an item in the list is selected.
   * @note If `undefined`, the items will not be selectable.
   */
  onSelection?: TOnItemSelection<TItem>
  /**
   * Callback for when a list button is clicked.
   * @default () => {}
   */
  onListButtonClick?: TSvgPanelOnClick
  /**
   * Callback for when an item button is clicked.
   * @default () => {}
   */
  onItemButtonClick?: TOnItemButtonClick<TItem>
}

/**
 * Gets the tooltip description for a list button.
 * @param button The button for which to get the tooltip.
 * @returns The tooltip description.
 * @default () => ''
 */
export type TGetListButtonTooltip = (button: TButtonSvgType) => string

/**
 * A column type for the list.
 */
export type TListColumnType<TItem> = keyof TItem
