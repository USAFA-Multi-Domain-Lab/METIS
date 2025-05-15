import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import {
  OPTIONS_COLUMN_WIDTH,
  OPTIONS_COLUMN_WIDTH_IF_LAST,
  useListContext,
} from '../List'
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
    itemButtonIcons: itemButtons,
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

  /* -- RENDER -- */

  /**
   * JSX for the individual cells.
   */
  const cellsJsx = compute<ReactNode>(() => {
    // Initialize the result.
    let result: ReactNode[] = []

    // Add the name cell.
    result.push(<ListColumnLabel key={'name'} column={'name'} text={'Name'} />)

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
