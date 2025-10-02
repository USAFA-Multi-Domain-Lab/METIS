import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import { MetisComponent } from '../../../../../../../shared'
import {
  OPTIONS_COLUMN_WIDTH,
  OPTIONS_COLUMN_WIDTH_IF_LAST,
  useListContext,
} from '../List'
import ListColumnLabel from './ListColumnLabel'
import './ListColumnLabels.scss'

/**
 * Labels for the columns of a `List` component.
 */
export default function ListColumnLabels<
  TItem extends MetisComponent,
>(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const {
    columns,
    ordering,
    itemButtonIcons,
    minNameColumnWidth,
    showingDeletedItems,
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

    // If the list order is maleable, add the drag
    // handle column width.
    if (ordering.mode === 'maleable') {
      columnWidths.push('2em')
    }

    // Add the name column width.
    columnWidths.push(`minmax(${minNameColumnWidth}, 1fr)`)

    // Add the warning column width,
    // if showing deleted items.
    if (showingDeletedItems) {
      columnWidths.push('2.5em')
    }

    // If there are item buttons, add the options
    // column width.
    if (itemButtonIcons.length) {
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

    // If the list order is maleable, add the drag
    // handle label.
    if (ordering.mode === 'maleable') {
      result.push(
        <div
          key={'ItemDragHandleLabel'}
          className='ItemCellLike ColumnLabelDragHandle'
        >
          <div className='DragHandleLabelIcon'></div>
        </div>,
      )
    }

    // Add the name cell.
    result.push(<ListColumnLabel key={'name'} column={'name'} text={'Name'} />)

    // If there is a deleted item, add the warning
    // cell.
    if (showingDeletedItems) {
      result.push(
        <div
          key={'ItemWarningLabel'}
          className='ItemCellLike ColumnLabelBlank'
        ></div>,
      )
    }

    // If there are item buttons, add the options
    // cell.
    if (itemButtonIcons.length) {
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
