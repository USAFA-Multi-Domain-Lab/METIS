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
import { TUserPermissionId } from '../../../../../../../../shared/users/permissions'
import {
  OPTIONS_COLUMN_WIDTH,
  OPTIONS_COLUMN_WIDTH_IF_LAST,
  useListContext,
} from '../../List'
import './ListItem.scss'
import ListItemCell from './ListItemCell'

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
    columns,
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
  const [selection, setSelection] = listContext.state.selection
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
      .set('Deleted', item.deleted),
  )

  /**
   * Dynamic styling for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    // Initialize the column widths.
    let columnWidths = []

    // Add the name column width.
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

  /* -- EFFECTS -- */

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
