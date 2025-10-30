import React, { useContext, useEffect, useRef, useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import {
  TDefaultProps,
  useDefaultProps,
  useEventListener,
  usePostInitEffect,
} from 'src/toolbox/hooks'
import { MetisComponent } from '../../../../../../shared'
import StringToolbox from '../../../../../../shared/toolbox/strings'
import { TUserPermissionId } from '../../../../../../shared/users/permissions'
import {
  TButtonSvgEngine,
  TSvgLayout,
  TSvgPanelElement_Input,
} from '../../user-controls/buttons/panels/types'
import './List.scss'
import ListDropBox from './ListDropBox'
import ListResizeHandler from './ListResizeHandler'
import ListValidator from './ListValidator'
import ListNav from './navs/ListNav'
import {
  TGetItemButtonDisabled,
  TGetItemButtonLabel,
  TGetItemButtonPermission,
  TGetItemTooltip,
  TOnItemButtonClick,
} from './pages/items/ListItem'
import ListPage, { TListPage_P } from './pages/ListPage'
import ListUpload from './uploads'

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
    initialSorting: {
      method: 'column-based',
      column: 'name',
      direction: 'ascending',
    },
    ordering: {
      mode: 'static',
    },
    deselectionBlacklist: [],
    uploads: [],
    elementAccess: null,
    searchBlacklist: [],
    getColumnLabel: (x) => StringToolbox.toTitleCase(x.toString()),
    getCellText: (item, column) => (item[column] as any).toString(),
    getItemTooltip: () => '',
    getListButtonLabel: () => '',
    getListButtonPermissions: () => [],
    getListButtonDisabled: () => false,
    getItemButtonLabel: () => '',
    getItemButtonPermissions: () => [],
    getItemButtonDisabled: () => false,
    getColumnWidth: () => '10em',
    onSelect: () => {},
    onItemDblClick: () => {},
    onListButtonClick: () => {},
    onItemButtonClick: () => {},
    onFileDrop: null,
    onReorder: () => {},
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
    ordering,
    listButtonIcons,
    itemButtonIcons,
    deselectionBlacklist,
    uploads,
    getListButtonLabel,
    getListButtonPermissions,
    getListButtonDisabled,
    getItemButtonLabel,
    getItemButtonPermissions,
    onListButtonClick,
    onItemButtonClick,
    onSelect,
    onFileDrop,
    onReorder,
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
    draggedItem: useState<TItem | null>(null),
    draggedItemStartY: useState<number>(0),
    itemOrderUpdateId: useState<string>(StringToolbox.generateRandomId()),
  }
  const [pageNumber, setPageNumber] = state.pageNumber
  const [processedItems] = state.processedItems
  const [itemsPerPage] = state.itemsPerPage
  const [selection, setSelection] = state.selection
  const [itemOrderUpdateId] = state.itemOrderUpdateId
  const elements: TList_E = {
    root: useRef<HTMLDivElement>(null),
    nav: useRef<HTMLDivElement>(null),
    navHeader: useRef<HTMLDivElement>(null),
    navHeading: useRef<HTMLDivElement>(null),
    buttons: useRef<HTMLDivElement>(null),
    overflow: useRef<HTMLDivElement>(null),
  }

  /* -- COMPUTED -- */

  /**
   * The computed pages of items in the list
   * based on the items passed and the number
   * of items per page configured.
   * @note When ordering mode is 'maleable', pagination is disabled
   * and all items are displayed on a single page to allow for proper
   * drag-and-drop reordering.
   */
  const pages = compute<TListPage_P<TItem>[]>(() => {
    const results: Required<TListPage_P<TItem>>[] = []
    let pageCursor: TListPage_P<TItem> = {
      items: [],
    }

    // If ordering mode is 'maleable', disable pagination
    // by setting all items to a single page
    if (defaultedProps.ordering.mode === 'maleable') {
      // Add all uploads first
      for (let upload of uploads) {
        pageCursor.items.push(upload)
      }
      // Add all regular items
      for (let item of processedItems) {
        pageCursor.items.push(item)
      }
      // Push the single page with all items
      results.push(pageCursor)
      return results
    }

    // Regular pagination logic for non-maleable ordering
    // Ensures that each page has the correct number
    // of items, and that when it reaches the correct
    // number, the page will be pushed to the results.
    const enforcePageCount = () => {
      if (pageCursor.items.length === itemsPerPage) {
        results.push(pageCursor)
        pageCursor = {
          items: [],
        }
      }
    }

    // Add uploads to respective pages.
    for (let upload of uploads) {
      enforcePageCount()
      pageCursor.items.push(upload)
    }
    // Add regular items to respective pages.
    for (let item of processedItems) {
      enforcePageCount()
      pageCursor.items.push(item)
    }

    // Push final page, whether complete in
    // count or not.
    results.push(pageCursor)

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

    // Only add pagination stepper when ordering mode is not 'maleable'
    // since maleable lists display all items on a single page
    if (defaultedProps.ordering.mode !== 'maleable') {
      buttons.push({
        key: 'stepper-page',
        type: 'stepper',
        maximum: pageCount,
        value: state.pageNumber,
      })
    }

    filteredListIcons.forEach((icon) => {
      buttons.push({
        key: icon,
        type: 'button',
        icon,
        label: getListButtonLabel(icon),
        permissions: getListButtonPermissions(icon),
        disabled: getListButtonDisabled(icon),
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
        key: icon,
        type: 'button',
        icon,
        label: getItemButtonLabel(icon),
        permissions: getItemButtonPermissions(icon),
        onClick: () => {
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
  >(() => (listButtons ?? []).concat(itemButtons ?? []))

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
    pages[pageNumber]?.items.some(({ deleted }) => deleted),
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

  // Reset page number when switching to maleable mode or ensure valid page when switching back
  useEffect(() => {
    // When switching to maleable mode, always show the first (and only) page
    if (ordering.mode === 'maleable') {
      setPageNumber(0)
    }
  }, [ordering.mode, pageCount])

  // Call `onSelect` callback whenever selection-state
  // changes.
  useEffect(() => onSelect(selection), [selection])

  // Deselect the item if it is not found in the
  // list of items.
  useEffect(() => {
    const selectionIsMissing = !items.find(({ _id }) => _id === selection?._id)
    const selectionIsDisabled = selection?.disabled ?? false
    if (selectionIsMissing || selectionIsDisabled) setSelection(null)
  }, [items, selection])

  // Deselect the currently selected item, if necessary.
  useEventListener(document, 'mousedown', (event: MouseEvent) => {
    const selectors = ['.ButtonMenu', ...deselectionBlacklist]
    const blacklistedClasses = ['InputBlocker']
    const rootElement = elements.root.current
    const target = event.target as HTMLElement
    // Get all elements that prevent deselection
    // of the item that is currently selected.
    const ignoredElms: HTMLElement[] = []
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll<HTMLElement>(selector)
      if (elements.length > 0) ignoredElms.push(...elements)
    })
    // Check if any of the blacklisted elements contain the element that
    // was clicked.
    const targetInIgnoredElms = ignoredElms.some(
      (elm) => elm.contains(target) || elm === target,
    )
    // Check if the element that was clicked contains a class that's
    // been blacklisted.
    const targetHasBlacklistedClass = blacklistedClasses.some((cls) =>
      target.classList.contains(cls),
    )
    // If the target is in the ignored elements, do not deselect.
    if (targetInIgnoredElms || targetHasBlacklistedClass) return
    // If the clicked element is not part of the list,
    // deselect the item.
    if (!rootElement?.contains(target)) setSelection(null)
  })

  // Give parent access to the list's elements, if
  // requested.
  useEffect(() => {
    if (defaultedProps.elementAccess) {
      defaultedProps.elementAccess.current = elements
    }
  }, [defaultedProps.elementAccess])

  // Call reorder callback function when item order
  // update ID changes.
  usePostInitEffect(() => {
    onReorder()
  }, [itemOrderUpdateId])

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
    pages,
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
   * The element representing the header of the
   * list navigation.
   */
  navHeader: React.RefObject<HTMLDivElement>
  /**
   * The element that contains the heading of the
   * list navigation, which exists inside the header.
   */
  navHeading: React.RefObject<HTMLDivElement>
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
   * @default { mode: 'automatic', column: 'name', method: 'descending' }
   */
  initialSorting?: TListSorting<TItem>
  /**
   * @see {@link TListOrdering}
   */
  ordering?: TListOrdering<TItem>
  /**
   * A list of HTML element css selectors used within a
   * JavaScript query selector which, if clicked, will not
   * deselect the currently selected item.
   * @default []
   * @example
   * ```js
   * ['.Class1', '.Class2', '.Class3']
   * ```
   */
  deselectionBlacklist?: string[]
  /**
   * Items that are being uploaded to the server, which
   * will be presumably added to the list once completed.
   * @default []
   */
  uploads?: ListUpload[]
  /**
   * Grants parent access to the refs used internally
   * by the list.
   */
  elementAccess?: React.MutableRefObject<TList_E | null> | null
  /**
   * The columns that cannot be searched within the list.
   * @default []
   */
  searchBlacklist?: TListColumnType<TItem>[]
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
   * Gets whether the button for the list is disabled.
   * @param button The button for which to check if it is disabled.
   * @returns Whether the button is disabled.
   * @default () => false
   */
  getListButtonDisabled?: TGetListButtonDisabled
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
   * @default () => []
   */
  getItemButtonPermissions?: TGetItemButtonPermission<TItem>
  /**
   * Gets whether the button for the item is disabled.
   * @param button The button for which to check if it is disabled.
   * @returns Whether the button is disabled.
   * @default () => false
   */
  getItemButtonDisabled?: TGetItemButtonDisabled<TItem>
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
   * Callback for when an item in the list is double-clicked.
   * @param item The item that was double-clicked.
   * @default () => {}
   */
  onItemDblClick?: (item: TItem) => void
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
  /**
   * Callback for when the order of items in the list
   * is changed by drag-and-drop.
   * @default () => {}
   * @note Only relevant if ordering mode is 'maleable'.
   */
  onReorder?: () => void
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
  /**
   * The item which is currently being dragged,
   * if any.
   */
  draggedItem: TReactState<TItem | null>
  /**
   * The y-position of the mouse when dragging
   * started for the currently dragged item, or the
   * last dragged item if no item is currently
   * being dragged.
   */
  draggedItemStartY: TReactState<number>
  /**
   * Represents an update to the order of items
   * in the list, which can be used to trigger
   * effects when the order changes.
   */
  itemOrderUpdateId: TReactState<string>
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
  aggregatedButtonIcons: string[]
  /**
   * Aggregated buttons, including list and
   * item buttons.
   */
  aggregatedButtons: NonNullable<TButtonSvgEngine['elements']>
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
  /**
   * The computed pages of items in the list
   * based on the items passed and the number
   * of items per page configured.
   */
  pages: TListPage_P<TItem>[]
}

/**
 * Gets the label for a list button.
 * @param button The button for which to get the label.
 * @returns The label.
 * @default () => ''
 */
// export type TGetListButtonLabel = (button: TSvgPanelElement['icon']) => string
export type TGetListButtonLabel = (button: string) => string

/**
 * Callback for when a list button is clicked.
 * @default () => {}
 */
// export type TOnListButtonClick = (button: TSvgPanelElement['icon']) => void
export type TOnListButtonClick = (button: string) => void

/**
 * Gets the permissions for a list button.
 * @param button The button for which to get the permissions.
 * @returns The permissions.
 * @default () => []
 */
export type TGetListButtonPermission = (
  button: string,
  // button: TSvgPanelElement['icon'],
) => TUserPermissionId[]

/**
 * Gets whether the button for the list is disabled.
 * @param button The button for which to check if it is disabled.
 * @returns Whether the button is disabled.
 * @default () => false
 */
export type TGetListButtonDisabled = (
  button: string,
  // button: TSvgPanelElement['icon'],
) => boolean

/**
 * A column type for the list.
 */
export type TListColumnType<TItem> = keyof TItem

/**
 * Base options for sorting items in a list, which
 * are shared between all sorting methods.
 */
export type TListSortingBase = {
  /**
   * Prevents the sorting method, column, and
   * direction from being changed by the user.
   * @default false
   */
  fixedConfig?: boolean
}

/**
 * Options for column-based sorting items in a list.
 * @see {@link TListSortingMethod}
 */
export type TListSortingColumnBased<TItem extends MetisComponent> = {
  /**
   * @see {@link TListSortingMethod}
   */
  method: 'column-based'
  /**
   * The column by which to sort.
   */
  column: TListColumnType<TItem>
  /**
   * The direction by which to sort.
   */
  direction: TListSortDirection
}

/**
 * Options for leaving items in a list unsorted.
 * @see {@link TListSortingMethod}
 */
export type TListSortingUnsorted = {
  /**
   * @see {@link TListSortingMethod}
   */
  method: 'unsorted'
}

/**
 * Data that defines how items in a list should
 * be sorted.
 */
export type TListSorting<TItem extends MetisComponent> = (
  | TListSortingColumnBased<TItem>
  | TListSortingUnsorted
) &
  TListSortingBase

/**
 * Configurable values for a list with static
 * ordering, meaning the order doesn't change.
 */
export type TListOrderingStatic = {
  /**
   * Disables reordering of items in the list by
   * the user.
   * @note Use 'maleable' to enable ordering changes.
   */
  mode: 'static'
}

/**
 * Configurable values for a list with maleable
 * ordering, meaning the order can be changed
 * by the user.
 */
export type TListOrderingMaleable<TItem extends MetisComponent> = {
  /**
   * Enables ordering of items in the list.
   * @note This will disable pagination to ensure
   * all items are visible for reordering.
   * @note Use 'static' to prevent user from
   * reordering list.
   */
  mode: 'maleable'
  /**
   * A callback for when the order of items in the list
   * has changed.
   * @param items The items in their new order. This will
   * be the same array instance as the `items` prop passed
   * to the list with the order mutated.
   */
  onReorder?: (items: TItem[]) => void
}

/**
 * Configuration for ordering items in the list.
 * This is different from sorting, as sorting simply
 * rearranges the items in the view, while ordering
 * actually changes the order of the items of the input
 * data.
 */
export type TListOrdering<TItem extends MetisComponent> =
  | TListOrderingStatic
  | TListOrderingMaleable<TItem>

/**
 * The method for sorting, whether automatic through the
 * selection of direction by column, or manual sorting
 * via drag-and-drop.
 */
export type TListSortingMethod = TListSorting<any>['method']

/**
 * The direction in which to sort items
 * in a list.
 */
export type TListSortDirection = 'ascending' | 'descending'

/**
 * Whether ordering of items in the list is enabled or disabled.
 */
export type TListOrderingMode = TListOrdering<any>['mode']
