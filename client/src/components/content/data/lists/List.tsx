import { useState } from 'react'
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

/**
 * Displays a list of items of the given type.
 */
export default function List<TItem extends TListItem>({
  name,
  items,
  itemsPerPage = 10,
  listButtons = [],
  itemButtons = [],
  getItemTooltip = () => '',
  getListButtonTooltip = () => '',
  getItemButtonTooltip = () => '',
  onSelection = () => {},
  onListButtonClick = () => {},
  onItemButtonClick = () => {},
}: TList_P<TItem>): JSX.Element | null {
  /* -- STATE -- */

  // The current page number to
  // display in the list.
  const [pageNumber, setPageNumber] = useState<number>(0)

  /* -- COMPUTED -- */

  /**
   * The computed pages of items in the list
   * based on the items passed and the number
   * of items per page configured.
   */
  const pages = compute<TListPage_P<TItem>[]>(() => {
    const results: Required<TListPage_P<TItem>>[] = []

    for (let i = 0; i < items.length; i += itemsPerPage) {
      results.push({
        items: items.slice(i, i + itemsPerPage),
        itemsPerPage,
        itemButtons,
        getItemTooltip,
        getItemButtonTooltip,
        onSelection,
        onItemButtonClick,
      })
    }

    return results
  })

  /**
   * The current page of items to display.
   */
  const currentPage = compute<TListPage_P<TItem>>(() => pages[pageNumber])

  /**
   * The current number of pages in the list.
   */
  const pageCount = compute<number>(() => pages.length)

  /* -- RENDER -- */

  // Render the list.
  return (
    <div className='List'>
      <ListNav
        headingText={name}
        pageNumberState={[pageNumber, setPageNumber]}
        pageCount={pageCount}
      />
      <ListPage key={`page_${pageNumber}`} {...currentPage} />
      <ListButtons
        buttons={listButtons}
        getButtonTooltip={getListButtonTooltip}
        onButtonClick={onListButtonClick}
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
   * The number of items to display per page.
   * @default 10
   */
  itemsPerPage?: number
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
