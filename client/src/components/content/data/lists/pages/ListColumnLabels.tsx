import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import ButtonSvgPanel_v2 from '../../../user-controls/buttons/ButtonSvgPanel_v2'
import { useListContext } from '../List'
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
   * Class name for the item button cell.
   */
  const itemButtonClass = compute<string>(() => {
    const classList = ['ItemButtons', 'ColumnLabel', 'ItemCellLike']

    if (!itemButtons.length) classList.push('Hidden')

    return classList.join(' ')
  })

  /**
   * Dynamic styling for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    // Initialize the column widths with
    // the name column width.
    let columnWidths = [`minmax(${minNameColumnWidth}, 1fr)`]

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
          buttons={itemButtons}
          size={'small'}
          onButtonClick={() => {}}
        />
      </div>
    </div>
  )
}
