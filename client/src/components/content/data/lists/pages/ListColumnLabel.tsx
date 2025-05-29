import Tooltip from 'src/components/content/communication/Tooltip'
import { compute } from 'src/toolbox'
import { TMetisComponent } from '../../../../../../../shared'
import { TListColumnType, useListContext } from '../List'
import './ListColumnLabel.scss'

/**
 * A label for a column of a `List` component.
 */
export default function ListColumnLabel<TItem extends TMetisComponent>({
  column,
  text,
}: TListColumnLabel<TItem>): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const [sorting, setSorting] = listContext.state.sorting

  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<string>(() => {
    const classList = [
      'ListColumnLabel',
      'ItemCellLike',
      `ListColumnLabel_${column.toString()}`,
    ]

    // If this column is the sorting column, add the
    // appropriate sorting class based on the sorting
    // method.
    if (sorting.column === column) {
      switch (sorting.method) {
        case 'ascending':
          classList.push('SortAscending')
          break
        case 'descending':
          classList.push('SortDescending')
          break
      }
    }

    return classList.join(' ')
  })

  /**
   * The description for the tooltip.
   */
  const tooltipDescription = compute<string>(() => {
    // If this column is the sorting column, return
    // the appropriate description based on the sorting
    // method.
    if (sorting.column === column) {
      switch (sorting.method) {
        case 'ascending':
          return 'Sort descending'
        case 'descending':
          return 'Sort ascending'
      }
    }
    // Otherwise, return the default description.
    else {
      return 'Sort ascending'
    }
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles a click on the column label.
   */
  const onClick = () => {
    // If this column is the sorting column, toggle
    // the sorting method.
    if (sorting.column === column) {
      setSorting({
        column,
        method: sorting.method === 'ascending' ? 'descending' : 'ascending',
      })
    }
    // Otherwise, set this column as the sorting column
    // and set the sorting method to ascending.
    else {
      setSorting({ column, method: 'ascending' })
    }
  }

  /* -- RENDER -- */

  // Render the column label.
  return (
    <div className={rootClass} onClick={onClick}>
      <div className='ColumnLabelText'>{text}</div>
      <div className='ColumnLabelSort'></div>
      <Tooltip description={tooltipDescription} />
    </div>
  )
}

/**
 * Props for `ListColumnLabel`.
 */
export type TListColumnLabel<TItem extends TMetisComponent> = {
  /**
   * The column associated with the label.
   */
  column: TListColumnType<TItem>
  /**
   * The text to display in the column label.
   */
  text: string
}
