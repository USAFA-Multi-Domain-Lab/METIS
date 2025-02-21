import { ReactNode, useRef } from 'react'
import ButtonMenuController from 'src/components/content/user-controls/buttons/ButtonMenuController'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import ButtonSvg, {
  TButtonSvgType,
} from '../../../user-controls/buttons/ButtonSvg'
import {
  OPTIONS_COLUMN_WIDTH,
  OPTIONS_COLUMN_WIDTH_IF_LAST,
  useListContext,
} from '../List'
import './ListItem.scss'
import ListItemCell from './ListItemCell'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import ClientMission from 'src/missions'

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
    itemButtons,
    minNameColumnWidth,
    getCellText,
    getItemButtonTooltip,
    getColumnWidth,
    onSelection,
    onItemButtonClick,
  } = listContext
  const root = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

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
   * Gets the description for the given button.
   */
  const getButtonDescription = (button: TButtonSvgType) =>
    getItemButtonTooltip(button, item)

  /**
   * Handles the click event for the item
   * options button.
   */
  const onOptionsClick = (event: React.MouseEvent) => {
    showButtonMenu(itemButtons, onButtonClick, {
      positioningTarget: event.target as HTMLDivElement,
      highlightTarget: root.current ?? undefined,
      getDescription: getButtonDescription,
    })
  }

  /**
   * Handles the click event for an item
   * button in the options menu.
   */
  const onButtonClick = (button: TButtonSvgType) => {
    onItemButtonClick(button, item)
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
          <ButtonSvg
            type='options'
            onClick={onOptionsClick}
            description={'View option menu'}
            disabled={itemButtons.length === 0 ? 'full' : 'none'}
          />
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
    <div className={rootClass} style={rootStyle} ref={root}>
      {cellsJsx}
      <ButtonMenuController
        target={root}
        buttons={itemButtons}
        highlightTarget={root.current ?? undefined}
        getDescription={getButtonDescription}
        onButtonClick={onButtonClick}
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
