import React, { useContext, useEffect, useRef, useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import {
  TDefaultProps,
  useDefaultProps,
  useEventListener,
} from 'src/toolbox/hooks'
import { MetisComponent } from '../../../../../../shared'
import StringToolbox from '../../../../../../shared/toolbox/strings'
import { TUserPermissionId } from '../../../../../../shared/users/permissions'
import {
  TButtonSvgEngine,
  TSvgLayout,
  TSvgPanelElement,
  TSvgPanelElement_Input,
} from '../../user-controls/buttons/v3/types'
import './List.scss'
import ListDropBox from './ListDropBox'
import ListResizeHandler from './ListResizeHandler'
import ListValidator from './ListValidator'
import ListNav from './navs/ListNav'
import {
  TGetItemButtonLabel,
  TGetItemButtonPermission,
  TGetItemTooltip,
  TOnItemButtonClick,
} from './pages/ListItem'
import ListPage, { TListPage_P } from './pages/ListPage'

/* -- CONSTANTS -- */

/**
 * The width of the options column.
 */
export const OPTIONS_COLUMN_WIDTH = '3.5em'

/**
 * The width of the options column if the options
 * column is the last column.
 */
export const OPTIONS_COLUMN_WIDTH_IF_LAST = OPTIONS_COLUMN_WIDTH // '2.76em'

/* -- CONTEXT -- */

/**
 * Context for the list, which will help distribute
 * list properties to its children.
 */
const ListContext = React.createContext<TListContextData<any> | null>(null)

/**
 * Hook used by List-related components to access
 * the list context.
 */
export const useListContext = <TItem extends MetisComponent>() => {
  const context = useContext(ListContext) as TListContextData<TItem> | null
  if (!context) {
    throw new Error('useListContext must be used within a list provider')
  }
  return context
}

/* -- FUNCTIONS -- */

/**
 * The defaults used for `List` props.
 */
export function createDefaultListProps<
  TItem extends MetisComponent,
>(): TDefaultProps<TList_P<TItem>> {
  return {
    columns: [],
    itemsPerPageMin: 10,
    minNameColumnWidth: '14em',
    listButtonIcons: [],
    itemButtonIcons: [],
    initialSorting: { column: 'name', method: 'ascending' },
    deselectOnClickOutside: true,
    getColumnLabel: (x) => StringToolbox.toTitleCase(x.toString()),
    getCellText: (item, column) => (item[column] as any).toString(),
    getItemTooltip: () => '',
    getListButtonLabel: () => '',
    getListButtonPermissions: () => [],
    getItemButtonLabel: () => '',
    getItemButtonPermissions: () => [],
    getColumnWidth: () => '10em',
    onSelect: () => {},
    onListButtonClick: () => {},
    onItemButtonClick: () => {},
    onFileDrop: null,
  }
}

/* -- COMPONENT -- */

/**
 * Displays a list of items of the given type.
 */
export default function List<TItem extends MetisComponent>(
  props: TList_P<TItem>,
): JSX.Element | null {
  const Provider = ListContext.Provider as React.Provider<
    TListContextData<TItem>
  >

  /* -- PROPS -- */

  // Set default props.
  const defaultedProps = useDefaultProps(props, createDefaultListProps<TItem>())

  // Parse props needed by the main list
  // component.
  const {
    items,
    itemsPerPageMin,
    listButtonIcons,
    itemButtonIcons,
    deselectOnClickOutside,
    getListButtonLabel,
    getListButtonPermissions,
    getItemButtonLabel,
    getItemButtonPermissions,
    onListButtonClick,
    onItemButtonClick,
    onSelect,
    onFileDrop,
  } = defaultedProps

  /* -- STATE -- */

  const [login] = useGlobalContext().login
  const isAuthorized = login?.user.isAuthorized ?? (() => false)

  const state: TList_S<TItem> = {
    pageNumber: useState<number>(0),
    processedItems: useState<TItem[]>(items),
    itemsPerPage: useState<number>(itemsPerPageMin),
    sorting: useState<TListSorting<TItem>>(defaultedProps.initialSorting),
    searchActive: useState<boolean>(false),
    selection: useState<TItem | null>(null),
    buttonOverflowCount: useState<number>(0),
    overflowActive: useState<boolean>(false),
  }
  const [pageNumber] = state.pageNumber
  const [processedItems] = state.processedItems
  const [itemsPerPage] = state.itemsPerPage
  const [selection, setSelection] = state.selection
  const elements: TList_E = {
    root: useRef<HTMLDivElement>(null),
    nav: useRef<HTMLDivElement>(null),
    buttons: useRef<HTMLDivElement>(null),
    overflow: useRef<HTMLDivElement>(null),
  }

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
      i < processedItems.length || !results.length;
      i += itemsPerPage
    ) {
      results.push({ items: processedItems.slice(i, i + itemsPerPage) })
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

  /**
   * The list button icons that are available
   * to be used in the list.
   * @note This will filter out any icons
   * that do not have any permissions associated
   * with them, meaning that they will not be
   * displayed in the list.
   * @see {@link getListButtonPermissions}
   */
  const filteredListIcons = compute<TMetisIcon[]>(() =>
    listButtonIcons.filter((icon) =>
      isAuthorized(getListButtonPermissions(icon)),
    ),
  )

  /**
   * The item button icons that are available
   * to be used in the list.
   * @note This will filter out any icons
   * that do not have any permissions associated
   * with them, meaning that they will not be
   * displayed in the list.
   * @see {@link getItemButtonPermissions}
   */
  const filteredItemIcons = compute<TMetisIcon[]>(() =>
    itemButtonIcons.filter((icon) =>
      isAuthorized(getItemButtonPermissions(icon)),
    ),
  )

  /**
   * Input data to use for the list buttons,
   * anywhere where they are needed throughout
   * the list.
   */
  const listButtons = compute<TListContextData<TItem>['listButtons']>(() => {
    let buttons: TSvgPanelElement_Input[] = []

    buttons.push({
      type: 'stepper',
      icon: 'stepper-page',
      maximum: pageCount,
      value: state.pageNumber,
    })

    filteredListIcons.forEach((icon) => {
      buttons.push({
        type: 'button',
        icon,
        label: getListButtonLabel(icon),
        permissions: getListButtonPermissions(icon),
        onClick: () => onListButtonClick(icon),
      })
    })

    return buttons
  })

  /**
   * Input data to use for the item buttons,
   * anywhere where they are needed throughout
   * the list.
   */
  const itemButtons = compute<TListContextData<TItem>['itemButtons']>(() => {
    let buttons: TSvgPanelElement_Input[] = []

    filteredItemIcons.forEach((icon) => {
      buttons.push({
        type: 'button',
        icon,
        label: getItemButtonLabel(icon),
        permissions: getItemButtonPermissions(icon),
        onClick: () => {
          console.log('Item button clicked:', icon, selection)
          if (selection) onItemButtonClick(icon, selection)
        },
      })
    })

    return buttons
  })

  /**
   * @see {@link TListContextData.aggregatedButtonIcons}
   */
  const aggregatedButtonIcons = compute<
    TListContextData<TItem>['aggregatedButtonIcons']
  >(() => ['stepper-page', ...filteredListIcons, ...filteredItemIcons])

  /**
   * @see {@link TListContextData.aggregatedButtons}
   */
  const aggregatedButtons = compute<
    TListContextData<TItem>['aggregatedButtons']
  >(() => listButtons?.concat(itemButtons ?? []))

  /**
   * @see {@link TListContextData.aggregateButtonLayout}
   */
  const aggregateButtonLayout = compute<TSvgLayout>(() => {
    let results: TSvgLayout = ['stepper-page']

    if (filteredListIcons.length > 0) {
      results = results.concat(['<divider>', ...filteredListIcons])
    }

    if (filteredItemIcons.length > 0) {
      results = results.concat(['<divider>', ...filteredItemIcons])
    }

    return results
  })

  /**
   * @see {@link TListContextData.showingDeletedItems}
   */
  const showingDeletedItems = compute<boolean>(() =>
    pages[pageNumber].items.some(({ deleted }) => deleted),
  )

  /* -- FUNCTIONS -- */

  /**
   * Callback for when file(s) are dropped into
   * the list.
   * @param event The event that triggered the file drop.
   * @note Only relevant if a file-drop callback is provided.
   */
  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    // Abort if no file-drop callback is provided.
    if (!onFileDrop) return

    let root_elm: HTMLDivElement | null = elements.root.current

    if (root_elm !== null) {
      let files: FileList = event.dataTransfer.files

      root_elm.classList.remove('DropPending')

      onFileDrop(files)
    }
  }

  /**
   * Callback for when file(s) are dragged over the list.
   * @param event The event that triggered the drag over.
   * @note Only relevant if a file-drop callback is provided.
   */
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    // Abort if no file-drop callback is provided.
    if (!onFileDrop) return

    let root_elm: HTMLDivElement | null = elements.root.current

    if (root_elm !== null) {
      root_elm.classList.add('DropPending')
    }
  }

  /**
   * Callback for when file(s) are dragged out of the list.
   * @param event The event that triggered the drag leave.
   * @note Only relevant if a file-drop callback is provided.
   */
  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    // Abort if no file-drop callback is provided.
    if (!onFileDrop) return

    let root_elm: HTMLDivElement | null = elements.root.current

    if (root_elm !== null) {
      root_elm.classList.remove('DropPending')
    }
  }

  /**
   * @see {@link TListContextData.requireEnabledOnly}
   */
  const requireEnabledOnly: TListContextData<TItem>['requireEnabledOnly'] = (
    item,
    next,
  ) => {
    if (item.disabled) return () => {}
    else return next
  }

  /* -- EFFECTS -- */

  // Call `onSelect` callback whenever selection-state
  // changes.
  useEffect(() => onSelect(selection), [selection])

  // Deselect the item if it is not found in the
  // list of items.
  useEffect(() => {
    const selectionIsMissing = !items.find(({ _id }) => _id === selection?._id)
    if (selectionIsMissing) setSelection(null)
  }, [items, selection])

  // Deselect the item if the user clicks outside of the list.
  useEventListener(document, 'click', (event: MouseEvent) => {
    // If deselect-on-click-outside is not enabled,
    // do nothing.
    if (!deselectOnClickOutside) return
    let rootElement = elements.root.current
    // If the root element is not found, do nothing.
    // This can happen if the component is unmounted.
    if (!rootElement) return

    // If the clicked element is not part of the list,
    // deselect the item.
    if (!rootElement.contains(event.target as Node)) {
      setSelection(null)
    }
  })

  /* -- RENDER -- */

  /**
   * The value to provide to the context.
   */
  const contextValue: TListContextData<TItem> = {
    ...defaultedProps,
    pageCount,
    listButtons,
    itemButtons,
    aggregatedButtonIcons,
    aggregatedButtons,
    aggregateButtonLayout,
    showingDeletedItems,
    requireEnabledOnly,
    state,
    elements,
  }

  // Render the list.
  return (
    <Provider value={contextValue}>
      <div
        className='List'
        ref={elements.root}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <ListValidator />
        <ListNav />
        {currentPageJsx}
        <ListResizeHandler />
        <ListDropBox />
      </div>
    </Provider>
  )
}

/* -- TYPES -- */

/**
 * Elements that need to be referenced throughout the
 * component tree.
 */
export type TList_E = {
  /**
   * The root element of the list.
   */
  root: React.RefObject<HTMLDivElement>
  /**
   * The element that contains the list navigation.
   */
  nav: React.RefObject<HTMLDivElement>
  /**
   * The element that contains the list buttons.
   */
  buttons: React.RefObject<HTMLDivElement>
  /**
   * The element that contains the overflow button.
   */
  overflow: React.RefObject<HTMLDivElement>
}

/**
 * Props for `List`.
 */
export type TList_P<TItem extends MetisComponent> = {
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
   * The minimum width for the name column.
   * @default '16em'
   */
  minNameColumnWidth?: string
  /**
   * The list-specific buttons to display, which when clicked,
   * will perform an action not specific to any item in the list.
   * @default []
   */
  listButtonIcons?: TMetisIcon[]
  /**
   * The item-specific buttons to display, which when clicked,
   * will perform an action specific to an item in the list.
   * @default []
   */
  itemButtonIcons?: TMetisIcon[]
  /**
   * The initial sorting state for the list.
   * @default { column: 'name', method: 'descending' }
   */
  initialSorting?: TListSorting<TItem>
  /**
   * Determines if the selected item should deselect
   * when the user clicks outside of the list.
   * @default true
   */
  deselectOnClickOutside?: boolean
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
   * @default (x) => StringToolbox.toTitleCase(x.toString())
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
   * Gets the label for a list button.
   * @param button The button for which to get the label.
   * @returns The label.
   * @default () => ''
   */
  getListButtonLabel?: TGetListButtonLabel
  /**
   * Gets the permissions for a list button.
   * @param button The button for which to get the permissions.
   * @returns The permissions.
   * @default () => []
   */
  getListButtonPermissions?: TGetListButtonPermission
  /**
   * Gets the label for the item's button.
   * @param button The button for which to get the label.
   * @param item The item for which to get the label.
   * @default () => ''
   */
  getItemButtonLabel?: TGetItemButtonLabel<TItem>
  /**
   * Gets the permissions for the item's button.
   * @param button The button for which to get the permissions.
   * @param item The item for which to get the permissions.
   * @default () => []
   */
  getItemButtonPermissions?: TGetItemButtonPermission<TItem>
  /**
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   * @default () => '10em'
   */
  getColumnWidth?: (column: TListColumnType<TItem>) => string
  /**
   * Callback for when an item in the list is selected
   * or deselected.
   * @param item The item that was selected, `null` if
   * deselected.
   * @default () => {}
   */
  onSelect?: (item: TItem | null) => void
  /**
   * Callback for when a list button is clicked.
   * @default () => {}
   */
  onListButtonClick?: TOnListButtonClick
  /**
   * Callback for when an item button is clicked.
   * @default () => {}
   */
  onItemButtonClick?: TOnItemButtonClick<TItem>
  /**
   * Callback for when files are dropped into the list.
   * @default null
   * @note If no callback is provided, the list will not
   * accept dropped files.
   */
  onFileDrop?: TNullable<(files: FileList) => void>
}

/**
 * The entire state for `List`.
 */
export type TList_S<TItem extends MetisComponent> = {
  /**
   * The current page number.
   */
  pageNumber: TReactState<number>
  /**
   * The items after processing (filtering/sorting)
   * is applied.
   */
  processedItems: TReactState<TItem[]>
  /**
   * The calculated amount of items per page
   * based on the space available in the list.
   */
  itemsPerPage: TReactState<number>
  /**
   * The current sorting state which defines
   * how the items in the list should currently
   * be sorted.
   */
  sorting: TReactState<TListSorting<TItem>>
  /**
   * Whether the search bar is currently active.
   */
  searchActive: TReactState<boolean>
  /**
   * The currently selected item in the list.
   */
  selection: TReactState<TItem | null>
  /**
   * The number of buttons overflowing in the
   * list navigation.
   */
  buttonOverflowCount: TReactState<number>
  /**
   * Whether the overflow menu is currently active
   * and displaying the overflow menu.
   */
  overflowActive: TReactState<boolean>
}

/**
 * The list context data provided to all children
 * of `List`.
 */
export type TListContextData<TItem extends MetisComponent> = Required<
  TList_P<TItem>
> & {
  /**
   * The current number of pages in the list.
   */
  pageCount: number
  /**
   * Input data to use for the item buttons,
   * anywhere where they are needed throughout
   * the list.
   */
  listButtons: TButtonSvgEngine['elements']
  /**
   * Input data to use for the item buttons,
   * anywhere where they are needed throughout
   * the list.
   */
  itemButtons: TButtonSvgEngine['elements']
  /**
   * Aggregated button icon list, including list and
   * item button icons.
   */
  aggregatedButtonIcons: TSvgPanelElement['icon'][]
  /**
   * Aggregated buttons, including list and
   * item buttons.
   */
  aggregatedButtons: TButtonSvgEngine['elements']
  /**
   * A button layout used to display the aggregated
   * list of buttons, including the list and item buttons.
   */
  aggregateButtonLayout: TSvgLayout
  /**
   * Whether there exists any deleted items on the
   * current page being displayed.
   */
  showingDeletedItems: boolean
  /**
   * Middleware which will wrap a function in a requirement
   * for the given item to be enabled for the code to be
   * executed. If the item is disabled, the function will
   * do nothing when called.
   */
  requireEnabledOnly: <TArgs extends Array<any>>(
    item: TItem,
    next: (...args: TArgs) => void,
  ) => (...args: TArgs) => void
  /**
   * The state for the list.
   */
  state: TList_S<TItem>
  /**
   * Elements that need to be referenced throughout the
   * component tree.
   */
  elements: TList_E
}

/**
 * Gets the label for a list button.
 * @param button The button for which to get the label.
 * @returns The label.
 * @default () => ''
 */
export type TGetListButtonLabel = (button: TSvgPanelElement['icon']) => string

/**
 * Callback for when a list button is clicked.
 * @default () => {}
 */
export type TOnListButtonClick = (button: TSvgPanelElement['icon']) => void

/**
 * Gets the permissions for a list button.
 * @param button The button for which to get the permissions.
 * @returns The permissions.
 * @default () => []
 */
export type TGetListButtonPermission = (
  button: TSvgPanelElement['icon'],
) => TUserPermissionId[]

/**
 * A column type for the list.
 */
export type TListColumnType<TItem> = keyof TItem

/**
 * Data that defines how items in a list should
 * be sorted.
 */
export type TListSorting<TItem extends MetisComponent> = {
  /**
   * The column by which to sort.
   */
  column: TListColumnType<TItem>
  /**
   * The method (direction) by which to sort.
   */
  method: TListSortMethod
}

/**
 * The method (direction) by which to sort items
 * in a list.
 */
export type TListSortMethod = 'ascending' | 'descending'
