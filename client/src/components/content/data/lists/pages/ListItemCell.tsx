import { ReactNode } from 'react'
import { compute } from 'src/toolbox'
import { TMetisComponent } from '../../../../../../../shared'
import Tooltip from '../../../communication/Tooltip'
import { TListColumnType, useListContext } from '../List'
import './ListItemCell.scss'

/**
 * A cell in a `List` component.
 */
export default function ListItemCell<TItem extends TMetisComponent>({
  item,
  column,
  children,
}: TListItemCell<TItem>): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const { getItemTooltip, itemButtonIcons: itemButtons } = listContext
  const [selection, setSelection] = listContext.state.selection

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
   * The tooltip description for the item.
   */
  const tooltipDescription = compute<string>(() => {
    // Get vanilla tooltip.
    let description: string = getItemTooltip(item)

    // Add R-Click prompt, if there
    // are item buttons.
    if (itemButtons.length) {
      if (description) {
        description += '\n\t\n'
      }
      description += `\`L-Click\` to select \n\t\n`
      description += `\`R-Click\` for options`
    }

    return description
  })

  /* -- FUNCTIONS -- */

  /**
   * Callback for when the item cell is clicked.
   */
  const onClick = () => setSelection(item)

  /* -- RENDER -- */

  // Render the item cell.
  return (
    <div className={rootClass} onClick={onClick}>
      <Tooltip description={tooltipDescription} /> {children}
    </div>
  )
}

/**
 * Props for `ListColumnLabel`.
 */
export type TListItemCell<TItem extends TMetisComponent> = {
  /**
   * The item to display in the cell.
   */
  item: TItem
  /**
   * The column associated with the label.
   */
  column: TListColumnType<TItem>
  /**
   * The JSX to display in the cell.
   */
  children?: ReactNode
}
