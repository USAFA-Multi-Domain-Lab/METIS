import { compute } from 'src/toolbox'
import Tooltip from '../../../communication/Tooltip'
import { TListColumnType, useListContext } from '../List'
import { TListItem } from './ListItem'
import './ListItemCell.scss'

/**
 * A cell in a `List` component.
 */
export default function ListItemCell<TItem extends TListItem>({
  item,
  column,
  text,
}: TListItemCell<TItem>): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const { getItemTooltip, itemButtons } = listContext

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
      if (description) description += '\n\t\n'
      description += `\`L-Click\` for options`
    }

    return description
  })

  /* -- RENDER -- */

  // Render the item cell.
  return (
    <div className={rootClass}>
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
   * The text to display in the cell.
   */
  text: string
}
