import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import { OPTIONS_COLUMN_WIDTH, useListContext } from '../List'
import ListColumnLabel from './ListColumnLabel'
import './ListColumnLabels.scss'
import { TListItem } from './ListItem'

/**
 * Labels for the columns of a `List` component.
 */
export default function ListColumnLabels<
  TItem extends TListItem,
>(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const {
    columns,
    itemButtons,
    minNameColumnWidth,
    getColumnWidth,
    getColumnLabel,
  } = listContext

  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<string>(() => {
    const classList = ['ListColumnLabels', 'ListItemLike']

    return classList.join(' ')
  })

  /**
   * Dynamic styling for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    // Initialize the column widths.
    let columnWidths: string[] = []

    // If there are item buttons, add the options
    // column width.
    if (itemButtons.length) {
      columnWidths.push(OPTIONS_COLUMN_WIDTH)
    }

    // Add the name column width.
    columnWidths.push(`minmax(${minNameColumnWidth}, 1fr)`)

    // Add the width for each column.
    columns.forEach((column) => columnWidths.push(getColumnWidth(column)))

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
    // Initialize the result.
    let result: ReactNode[] = []

    // If there are item buttons, add the options
    // cell.
    if (itemButtons.length) {
      result.push(
        <div
          key={'ItemOptionsLabel'}
          className='ItemCellLike ColumnLabelBlank'
        ></div>,
      )
    }

    // Add the name cell.
    result.push(<ListColumnLabel key={'name'} column={'name'} text={'Name'} />)

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
    </div>
  )
}
