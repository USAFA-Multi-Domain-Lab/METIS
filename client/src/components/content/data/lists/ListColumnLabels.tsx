import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import { TList_P } from './List'
import ListColumnLabel from './ListColumnLabel'
import './ListColumnLabels.scss'
import { TListItem } from './ListItem'

/**
 * Labels for the columns of a `List` component.
 */
export default function ListColumnLabels<TItem extends TListItem>({
  itemButtonCount,
  columns = [],
  getColumnLabel = (x) => x.toString(),
  getColumnWidth = () => '10em',
}: TListColumnLabels<TItem>): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<string>(() => {
    const classList = ['ListColumnLabels', 'ListItemLike']

    return classList.join(' ')
  })

  /**
   * Class name for the item button cell.
   */
  const itemButtonClass = compute<string>(() => {
    const classList = ['ItemButtons', 'ColumnLabel', 'ItemCellLike']

    if (itemButtonCount === 0) classList.push('Hidden')

    return classList.join(' ')
  })

  /**
   * The filler item buttons for the item button label.
   */
  const itemButtonFillers = compute<Array<'_blank'>>(() =>
    new Array(itemButtonCount).fill('_blank'),
  )

  /**
   * Dynamic styling for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    // Initialize the column widths with
    // the name column width.
    let columnWidths = ['1fr']

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
    // Initialize the result with the name column.
    let result: ReactNode[] = [
      <ListColumnLabel key={'name'} column={'name'} text={'Name'} />,
    ]

    // Add a column label for each column
    // passed in the props.
    columns.forEach((column) =>
      result.push(
        <ListColumnLabel
          key={column.toString()}
          column={column}
          text={getColumnLabel(column)}
        />,
      ),
    )

    return result
  })

  // Render the column labels.
  return (
    <div className={rootClass} style={rootStyle}>
      {cellsJsx}
      <div className={itemButtonClass}>
        <ButtonSvgPanel_v2
          buttons={itemButtonFillers}
          size={'small'}
          onButtonClick={() => {}}
        />
      </div>
    </div>
  )
}

/**
 * Props for `ListColumnLabels`.
 */
export type TListColumnLabels<TItem extends TListItem> = {
  /**
   * Additional columns to display for each item.
   * @default []
   */
  columns?: TList_P<TItem>['columns']
  /**
   * The number of item buttons for the list.
   */
  itemButtonCount: number
  /**
   * Gets the column label for the item.
   * @param column The column for which to get the label.
   * @returns The column label.
   * @default (x) => x.toString()
   */
  getColumnLabel?: TList_P<TItem>['getColumnLabel']
  /**
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   * @default () => '10em'
   */
  getColumnWidth?: TList_P<TItem>['getColumnWidth']
}
