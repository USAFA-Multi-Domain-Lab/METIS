import { ReactNode, useRef } from 'react'
import { useButtonMenuEngine } from 'src/components/content/user-controls/buttons/ButtonMenu'
import ButtonMenuController from 'src/components/content/user-controls/buttons/ButtonMenuController'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/v3/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/v3/hooks'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { TUserPermissionId } from '../../../../../../../shared/users/permissions'
import {
  OPTIONS_COLUMN_WIDTH,
  OPTIONS_COLUMN_WIDTH_IF_LAST,
  useListContext,
} from '../List'
import './ListItem.scss'
import ListItemCell from './ListItemCell'

/**
 * A list item in a `List` component.
 */
export default function ListItem<T extends TListItem>({
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
    getCellText,
    getColumnWidth,
    isDisabled,
  } = listContext
  const [selection, setSelection] = listContext.state.selection
  const root = useRef<HTMLDivElement>(null)
  const optionsEngine = useButtonMenuEngine({
    buttons: itemButtons,
    layout: ['<slot>'],
    dependencies: itemButtonIcons,
  })
  const optionMenuButtonEngine = useButtonSvgEngine({
    buttons: [
      {
        icon: 'options',
        onClick: (event) => onOptionsClick(event),
        description: 'View option menu',
        disabled: itemButtons.length === 0,
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<ClassList>(() => {
    let result = new ClassList('ListItem', 'ListItemLike')
    result.set('Disabled', isDisabled(item))
    result.set('Selected', selection?._id === item._id)
    return result
  })

  /**
   * Dynamic styling for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    // Initialize the column widths.
    let columnWidths = []

    // Add the name column width.
    columnWidths.push(`minmax(${minNameColumnWidth}, 1fr)`)

    // If there are item buttons, add the options
    // column width.
    if (itemButtons.length) {
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

  /* -- FUNCTIONS -- */

  /**
   * Handles the click event for the item
   * options button.
   */
  const onOptionsClick = (event: React.MouseEvent) => {
    // Show the button menu.
    showButtonMenu(optionsEngine, {
      positioningTarget: event.target as HTMLDivElement,
      highlightTarget: root.current ?? undefined,
    })
    // Force selection of the item.
    setSelection(item)
  }

  /**
   * Callback for when the button menu is activated.
   */
  const onButtonMenuActivate = () => {
    // Force selection of the item.
    setSelection(item)
  }

  /* -- RENDER -- */

  /**
   * JSX for the individual cells.
   */
  const cellsJsx = compute<ReactNode>(() => {
    // Initialize the result.
    let result: ReactNode[] = []

    // Add the name cell.
    result.push(
      <ListItemCell
        key={'name'}
        item={item}
        column={'name'}
        text={item.name}
      />,
    )

    // If there are item buttons, add the options
    // cell.
    if (itemButtons.length) {
      result.push(
        <div key={'options'} className='ItemCellLike ItemOptions'>
          <ButtonSvgPanel engine={optionMenuButtonEngine} />
        </div>,
      )
    }

    // Add a cell for each column
    // passed in the props.
    columns.forEach((column) =>
      result.push(
        <ListItemCell
          key={column.toString()}
          item={item}
          column={column}
          text={getCellText(item, column)}
        />,
      ),
    )

    return result
  })

  // Render the list item.
  return (
    <div className={rootClass.value} style={rootStyle} ref={root}>
      {cellsJsx}
      <ButtonMenuController
        target={root}
        engine={optionsEngine}
        highlightTarget={root.current ?? undefined}
        trigger={'r-click'}
        onActivate={onButtonMenuActivate}
      />
    </div>
  )
}

/**
 * Props for `ListItem`.
 */
export type TListItem_P<T extends TListItem> = {
  /**
   * The item to display.
   */
  item: T
}

/**
 * An object that is compatible with the List component
 * as an item.
 * @note Implement this interface in a class in order
 * to make the class compatible with the List component.
 */
export type TListItem = {
  /**
   * The ID of the item.
   */
  _id: string
  /**
   * The name of the item.
   */
  name: string
}

/**
 * Gets the tooltip description for the item.
 * @param item The item for which to get the tooltip.
 * @returns The tooltip description.
 */
export type TGetItemTooltip<TItem extends TListItem> = (item: TItem) => string

/**
 * Gets the label for the item's button.
 * @param button The button for which to get the label.
 * @param item The item for which to get the label.
 * @returns The label.
 */
export type TGetItemButtonLabel<TItem extends TListItem> = (
  button: TMetisIcon,
) => string

/**
 * Gets the permissions for the item's button.
 * @param button The button for which to get the permissions.
 * @returns The permissions.
 * @default () => []
 */
export type TGetItemButtonPermission<TItem extends TListItem> = (
  button: TMetisIcon,
) => TUserPermissionId[]

/**
 * A callback for when an item in the list is clicked.
 * @param item The item that was clicked.
 */
export type TOnItemSelection<TItem extends TListItem> = (item: TItem) => void

/**
 * A callback for when a button for an item is clicked.
 * @param item The item with which the button is associated.
 * @param button The type of button clicked.
 */
export type TOnItemButtonClick<TItem extends TListItem> = (
  button: TMetisIcon,
  item: TItem,
) => void
