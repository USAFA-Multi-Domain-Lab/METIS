import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import { TButtonSvgType } from '../../../user-controls/buttons/ButtonSvg'
import { OPTIONS_COLUMN_WIDTH, useListContext } from '../List'
import './ListItem.scss'
import ListItemCell from './ListItemCell'

/**
 * A list item in a `List` component.
 */
export default function ListItem<T extends TListItem>({
  item,
}: TListItem_P<T>): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<T>()
  const {
    columns,
    itemButtons,
    minNameColumnWidth,
    getCellText,
    getItemTooltip,
    getColumnWidth,
    onSelection,
  } = listContext

  /* -- COMPUTED -- */

  /**
   * The tooltip description for the item.
   */
  const itemTooltipDescription = compute<string>(() => getItemTooltip(item))

  /**
   * Root class name for the component.
   */
  const rootClass = compute<string>(() => {
    const classList = ['ListItem', 'ListItemLike']

    // Add 'Selectable' class if a click callback
    // is provided.
    if (onSelection) classList.push('Selectable')

    return classList.join(' ')
  })

  /**
   * Dynamic styling for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    // Initialize the column widths with
    // the name column width.
    let columnWidths = [
      OPTIONS_COLUMN_WIDTH,
      `minmax(${minNameColumnWidth}, 1fr)`,
    ]

    // Add the width for each column.
    columns.forEach((column) => columnWidths.push(getColumnWidth(column)))

    // Add width for the buttons column.
    columnWidths.push('auto')

    // Return the style object.
    return {
      gridTemplateColumns: columnWidths.join(' '),
    }
  })

  /* -- RENDER -- */

  /**
   * JSX for the individual cells.
   */
  const cellsJsx = compute<ReactNode>(() => {
    // Initialize the result with the name cell.
    let result: ReactNode[] = [
      <div key={'options'} className='ItemCellLike ItemOptions'></div>,
      <ListItemCell
        key={'name'}
        item={item}
        column={'name'}
        text={item.name}
      />,
    ]

    // Add a column label for each column
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
    <div className={rootClass} style={rootStyle}>
      {cellsJsx}
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
 * Gets the tooltip description for the item's button.
 * @param button The button for which to get the tooltip.
 * @param item The item for which to get the tooltip.
 * @returns The tooltip description.
 */
export type TGetItemButtonTooltip<TItem extends TListItem> = (
  button: TButtonSvgType,
  item: TItem,
) => string

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
  button: TButtonSvgType,
  item: TItem,
) => void
