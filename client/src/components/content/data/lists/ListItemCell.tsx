import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import { TList_P, TListColumnType } from './List'
import { TListItem } from './ListItem'
import './ListItemCell.scss'

/**
 * A cell in a `List` component.
 */
export default function ListItemCell<TItem extends TListItem>({
  item,
  column,
  tooltipDescription = '',
  getCellText = (item, column) => (item[column] as any).toString(),
  onClick = () => {},
}: TListItemCell<TItem>): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<string>(() => {
    const classList = [
      'ListItemCell',
      'ItemCellLike',
      `ListItemCell_${column.toString()}`,
    ]

    return classList.join(' ')
  })

  /**
   * The text to display in the cell.
   */
  const text = compute<string>(() => getCellText(item, column))

  /* -- RENDER -- */

  // Render the column label.
  return (
    <div className={rootClass} onClick={onClick}>
      {text} <Tooltip description={tooltipDescription} />
    </div>
  )
}

/**
 * Props for `ListColumnLabel`.
 */
export type TListItemCell<TItem extends TListItem> = {
  /**
   * The item to display in the cell.
   */
  item: TItem
  /**
   * The column associated with the label.
   */
  column: TListColumnType<TItem>
  /**
   * The tooltip description for the item.
   * @default ''
   */
  tooltipDescription?: string
  /**
   * Gets the text for a list item cell.
   * @param item The item for which to get the text.
   * @param column The column for which to get the text.
   * @returns The text to display in the cell.
   * @default () => (item[column] as any).toString()
   */
  getCellText?: TList_P<TItem>['getCellText']
  /**
   * Callback for when the cell is clicked.
   * @default () => {}
   */
  onClick?: () => void
}
