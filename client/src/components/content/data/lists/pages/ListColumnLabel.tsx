import Tooltip from 'src/components/content/communication/Tooltip'
import { compute } from 'src/toolbox'
import { MetisComponent } from '../../../../../../../shared'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { TListColumnType, useListContext } from '../List'
import './ListColumnLabel.scss'

/**
 * A label for a column of a `List` component.
 */
export default function ListColumnLabel<TItem extends MetisComponent>({
  column,
  text,
}: TListColumnLabel<TItem>): TReactElement | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const [sorting, setSorting] = listContext.state.sorting

  /* -- COMPUTED -- */

  /**
   * Root class name for the component.
   */
  const rootClass = compute<ClassList>(() => {
    let result = new ClassList(
      'ListColumnLabel',
      'ItemCellLike',
      `ListColumnLabel_${column.toString()}`,
    ).set('SortLocked', sorting.fixedConfig)

    // If this column is the sorting column, add the
    // appropriate sorting class based on the sorting
    // method.
    if (sorting.method === 'column-based' && sorting.column === column) {
      result.switch(
        {
          ascending: 'SortAscending',
          descending: 'SortDescending',
        },
        sorting.direction,
      )
    }

    return result
  })

  /**
   * The description for the tooltip.
   */
  const tooltipDescription = compute<string>(() => {
    // If sorting is locked, return an empty string.
    if (sorting.fixedConfig) return ''

    // If this column is the sorting column, return
    // the appropriate description based on the sorting
    // method.
    if (sorting.method === 'column-based' && sorting.column === column) {
      switch (sorting.direction) {
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
    // If sorting is locked, do nothing.
    if (sorting.fixedConfig) return

    // If this column is the sorting column, toggle
    // the sorting method.
    if (sorting.method === 'column-based' && sorting.column === column) {
      setSorting({
        method: 'column-based',
        column,
        direction:
          sorting.direction === 'ascending' ? 'descending' : 'ascending',
      })
    }
    // Otherwise, set this column as the sorting column
    // and set the sorting method to ascending.
    else {
      setSorting({ method: 'column-based', column, direction: 'ascending' })
    }
  }

  /* -- RENDER -- */

  // Render the column label.
  return (
    <div className={rootClass.value} onClick={onClick}>
      <div className='ColumnLabelText'>{text}</div>
      <div className='ColumnLabelSort'></div>
      <Tooltip description={tooltipDescription} />
    </div>
  )
}

/**
 * Props for `ListColumnLabel`.
 */
export type TListColumnLabel<TItem extends MetisComponent> = {
  /**
   * The column associated with the label.
   */
  column: TListColumnType<TItem>
  /**
   * The text to display in the column label.
   */
  text: string
}
