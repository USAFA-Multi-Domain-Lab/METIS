import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { useButtonMenuEngine } from 'src/components/content/user-controls/buttons/ButtonMenu'
import ButtonMenuController from 'src/components/content/user-controls/buttons/ButtonMenuController'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import WarningIndicator from 'src/components/content/user-controls/WarningIndicator'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { MetisComponent } from '../../../../../../../../shared'
import ClassList from '../../../../../../../../shared/toolbox/html/class-lists'
import StringToolbox from '../../../../../../../../shared/toolbox/strings'
import { TUserPermissionId } from '../../../../../../../../shared/users/permissions'
import {
  OPTIONS_COLUMN_WIDTH,
  OPTIONS_COLUMN_WIDTH_IF_LAST,
  useListContext,
} from '../../List'
import ItemCellDragHandle from './cells/ItemCellDragHandle'
import ListItemCell from './cells/ListItemCell'
import './ListItem.scss'

/**
 * A list item in a `List` component.
 */
export default function ListItem<T extends MetisComponent>({
  item,
}: TListItem_P<T>): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const listContext = useListContext<T>()
  const { showButtonMenu } = globalContext.actions
  const {
    items,
    columns,
    ordering,
    itemButtonIcons,
    itemButtons,
    minNameColumnWidth,
    showingDeletedItems,
    getCellText,
    getColumnWidth,
    requireEnabledOnly,
    onItemDblClick,
    getItemButtonDisabled,
  } = listContext
  const { root: list } = listContext.elements
  const [selection, setSelection] = listContext.state.selection
  const [draggedItem] = listContext.state.draggedItem
  const [draggedItemStartY] = listContext.state.draggedItemStartY
  const [_, setItemOrderUpdateId] = listContext.state.itemOrderUpdateId
  const root = useRef<HTMLDivElement>(null)
  const [disabled, setDisabled] = useState<boolean>(item.disabled)
  const optionsEngine = useButtonMenuEngine({
    elements: itemButtons,
    layout: ['<slot>'],
    dependencies: [...itemButtonIcons],
  })
  const optionMenuButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'options',
        type: 'button',
        icon: 'options',
        onClick: (event) => onOptionsClick(event),
        description: 'View option menu',
        disabled: !itemButtonIcons.length,
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<ClassList>(() =>
    new ClassList('ListItem', 'ListItemLike')
      .set('PartiallyDisabled', disabled)
      .set('Selected', selection?._id === item._id)
      .set('Deleted', item.deleted)
      .set('Dragged', item._id === draggedItem?._id),
  )

  /**
   * Whether this item is currently being dragged.
   */
  const isDragged = compute<boolean>(() => item._id === draggedItem?._id)

  /**
   * Dynamic styling for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    // Initialize the column widths.
    let columnWidths = []

    // If the list is maleable, add the drag
    // handle column width.
    if (ordering.mode === 'maleable') {
      columnWidths.push('2em')
    }

    // Add name column width.
    columnWidths.push(`minmax(${minNameColumnWidth}, 1fr)`)

    // Add the warning column width,
    // if showing deleted items.
    if (showingDeletedItems) {
      columnWidths.push('2.5em')
    }

    // If there are item buttons, add the options
    // column width.
    if (itemButtons?.length) {
      columnWidths.push(
        columns.length ? OPTIONS_COLUMN_WIDTH : OPTIONS_COLUMN_WIDTH_IF_LAST,
      )
    }

    // Add the width for each column.
    columns.forEach((column) => columnWidths.push(getColumnWidth(column)))

    // Return the style object.
    return {
      gridTemplateColumns: columnWidths.join(' '),
    }
  })

  /**
   * The description for the JSX where the options button is rendered.
   */
  const optionsJsxDescription = useMemo<string>(() => {
    // Get the description for the options button.
    const button = optionMenuButtonEngine.get('options')
    if (!button) return ''
    return button.description
  }, [optionMenuButtonEngine])

  /* -- FUNCTIONS -- */

  /**
   * Looks at the state of the dragged item and the
   * movement of the mouse to determine if the item
   * should be moved in the list.
   * @param event The most recent mouse event.
   */
  const moveItemIfNeeded = (event: MouseEvent) => {
    // Only the dragged item should handle
    // reordering logic. Also, if no list element
    // is available, abort.
    if (!isDragged || !list.current) return

    const hoverOverOffset = -5
    let mouseY = event.clientY

    // Find all list items and determine which one the mouse is over
    let listItems = Array.from(
      list.current.querySelectorAll('.ListItem'),
    ).filter(
      (element) => !element.classList.contains('Dragged'),
    ) as HTMLElement[]

    let targetItem: HTMLElement | null = null
    let targetIndex = -1

    // Find the item the mouse is currently over
    for (const element of listItems) {
      let rect = element.getBoundingClientRect()
      if (
        mouseY >= rect.top - hoverOverOffset &&
        mouseY <= rect.bottom + hoverOverOffset
      ) {
        targetItem = element
        break
      }
    }

    if (targetItem) {
      // Get the item ID from the element and find its index
      let itemId = targetItem.getAttribute('data-item-id')
      if (itemId) {
        targetIndex = items.findIndex((i) => i._id === itemId)
      }
    }

    if (targetIndex !== -1) {
      const draggedIndex = items.findIndex((i) => i._id === item._id)
      if (draggedIndex === -1) return

      // Track previous mouse Y position using a ref
      const prevMouseYRef = ((moveItemIfNeeded as any).prevMouseYRef ??= {
        value: null,
      })

      let insertIndex: number

      if (prevMouseYRef.value !== null) {
        if (mouseY > prevMouseYRef.value) {
          // Moving downward, place below target
          insertIndex = targetIndex + 1
        } else if (mouseY < prevMouseYRef.value) {
          // Moving upward, place above target
          insertIndex = targetIndex
        } else {
          // No movement
          return
        }
      } else {
        // First move, default to above target
        insertIndex = targetIndex
      }

      prevMouseYRef.value = mouseY

      // Adjust insert index if dragged item is before the target
      if (draggedIndex < insertIndex) {
        insertIndex--
      }

      // If the dragged item is not already at the target position, move it
      if (draggedIndex !== insertIndex) {
        items.splice(draggedIndex, 1)
        items.splice(insertIndex, 0, item)
        setItemOrderUpdateId(StringToolbox.generateRandomId())
      }
    }
  }

  /**
   * Offsets the position of the dragged item
   * to make it follow the mouse cursor.
   * @param event The most recent mouse event.
   */
  const offsetDraggedItem = (event: MouseEvent) => {
    // Abort if not dragging or if
    // the root element is not available.
    if (!isDragged || !root.current) return

    let rootElm = root.current

    // First clear the top to get accurate measurements.
    rootElm.style.top = `unset`

    // Find the drag-handle for the item,
    // aborting if it is not found.
    let dragHandle = rootElm.querySelector('.ItemCellDragHandle')
    if (!dragHandle) return

    // Determine the offset for the dragged
    // item based on the initially recorded
    // mouse Y position and the current mouse
    // Y position.
    let dragHandleRect = dragHandle.getBoundingClientRect()
    let offsetY = event.clientY - dragHandleRect.top - draggedItemStartY

    // Update the styling.
    rootElm.style.top = `${offsetY}px`
  }

  /**
   * Handles the click event for the item
   * options button.
   */
  const onOptionsClick = requireEnabledOnly(item, (event: React.MouseEvent) => {
    // Show the button menu.
    showButtonMenu(optionsEngine, {
      positioningTarget: event.target as HTMLDivElement,
      highlightTarget: root.current ?? undefined,
    })
    // Force selection of the item.
    setSelection(item)
  })

  /**
   * Callback for when the button menu is activated.
   */
  const onButtonMenuActivate = () => {
    // Force selection of the item.
    setSelection(item)
  }

  /**
   * Callback for global mouse move events when this item is being dragged.
   */
  const onGlobalMouseMove = (event: MouseEvent) => {
    if (isDragged) {
      moveItemIfNeeded(event)
      offsetDraggedItem(event)
    }
  }

  /* -- EFFECTS -- */

  // Set up global mouse event listeners when this item is being dragged
  useEffect(() => {
    if (isDragged) {
      window.addEventListener('mousemove', onGlobalMouseMove)

      return () => {
        window.removeEventListener('mousemove', onGlobalMouseMove)
      }
    } else {
      if (root.current) root.current.style.top = `${0}px`
    }
  }, [isDragged])

  // Set up callback for disabled state changes
  useEffect(() => {
    // Register the callback and get the unregister function
    const unregister = item.onDisabledChange(setDisabled)

    // Return cleanup function that calls the unregister function
    return unregister
  }, [item])

  useEffect(() => {
    // Enable/disable any buttons when the
    // selection changes.
    itemButtonIcons.forEach((icon) =>
      optionsEngine.setDisabled(
        icon,
        !selection || getItemButtonDisabled(icon, selection),
      ),
    )
  }, [selection])

  useEffect(() => {
    // If the item is disabled, disable the
    // options button.
    optionMenuButtonEngine.setDisabled(
      'options',
      disabled || !itemButtonIcons.length,
    )
  }, [disabled, itemButtonIcons.length])

  useEffect(() => {
    if (selection?._id === item._id && disabled) {
      // If the item is disabled and it is selected,
      // clear the selection.
      setSelection(null)
    }
  }, [disabled])

  /* -- RENDER -- */

  /**
   * JSX for the individual cells.
   */
  const cellsJsx = compute<ReactNode>(() => {
    // Initialize the result.
    let result: ReactNode[] = []

    // If the list is maleable, add the drag
    // handle cell.
    if (ordering.mode === 'maleable') {
      result.push(<ItemCellDragHandle key={'drag-handle'} item={item} />)
    }

    // Add the name cell.
    result.push(
      <ListItemCell key={'name'} item={item} column={'name'}>
        {item.name}
      </ListItemCell>,
    )

    // Add the warning cell.
    if (showingDeletedItems) {
      result.push(
        <div className='ItemCellLike ItemCellWarning' key={'warning'}>
          <WarningIndicator
            active={item.deleted}
            description='This item has been marked as deleted.'
          />
        </div>,
      )
    }

    // If there are item buttons, add the options
    // cell.
    if (itemButtons?.length) {
      result.push(
        <div key={'options'} className='ItemCellLike ItemOptions'>
          <ButtonSvgPanel engine={optionMenuButtonEngine} />
          <Tooltip description={optionsJsxDescription} />
        </div>,
      )
    }

    // Add a cell for each column
    // passed in the props.
    columns.forEach((column) =>
      result.push(
        <ListItemCell key={column.toString()} item={item} column={column}>
          {getCellText(item, column)}
        </ListItemCell>,
      ),
    )

    return result
  })

  // Render the list item.
  return (
    <div
      className={rootClass.value}
      style={rootStyle}
      ref={root}
      data-item-id={item._id}
      onDoubleClick={() => onItemDblClick(item)}
    >
      {cellsJsx}
      <ButtonMenuController
        target={root}
        engine={optionsEngine}
        highlightTarget={root.current ?? undefined}
        trigger={'r-click'}
        listen={!disabled}
        onActivate={onButtonMenuActivate}
      />
    </div>
  )
}

/**
 * Props for `ListItem`.
 */
export type TListItem_P<T extends MetisComponent> = {
  /**
   * The item to display.
   */
  item: T
}

/**
 * Gets the tooltip description for the item.
 * @param item The item for which to get the tooltip.
 * @returns The tooltip description.
 */
export type TGetItemTooltip<TItem extends MetisComponent> = (
  item: TItem,
) => string

/**
 * Gets the label for the item's button.
 * @param button The button for which to get the label.
 * @param item The item for which to get the label.
 * @returns The label.
 */
export type TGetItemButtonLabel<TItem extends MetisComponent> = (
  // button: TSvgPanelElement['icon'],
  button: string,
) => string

/**
 * Gets the permissions for the item's button.
 * @param button The button for which to get the permissions.
 * @returns The permissions.
 * @default () => []
 */
export type TGetItemButtonPermission<TItem extends MetisComponent> = (
  button: string,
) => TUserPermissionId[]

/**
 * Gets whether the button for the item is disabled.
 * @param button The button for which to check if it is disabled.
 * @returns Whether the button is disabled.
 * @default () => false
 */
export type TGetItemButtonDisabled<TItem extends MetisComponent> = (
  // button: TSvgPanelElement['icon'],
  button: string,
  item: TItem | null,
) => boolean

/**
 * A callback for when an item in the list is clicked.
 * @param item The item that was clicked.
 */
export type TOnItemSelection<TItem extends MetisComponent> = (
  item: TItem,
) => void

/**
 * A callback for when a button for an item is clicked.
 * @param item The item with which the button is associated.
 * @param button The type of button clicked.
 */
export type TOnItemButtonClick<TItem extends MetisComponent> = (
  // button: TSvgPanelElement['icon'],
  button: string,
  item: TItem,
) => void
