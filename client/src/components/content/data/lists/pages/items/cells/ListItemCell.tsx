import { compute } from '@client/toolbox'
import type { MetisComponent } from '@shared/MetisComponent'
import type { ReactNode } from 'react'
import Tooltip from '../../../../../communication/Tooltip'
import type { TListColumnType } from '../../../List'
import { useListContext } from '../../../List'
import './ListItemCell.scss'

/**
 * A cell in a `List` component.
 */
export default function ListItemCell<TItem extends MetisComponent>({
  item,
  column,
  children,
}: TListItemCell<TItem>): TReactElement | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const { getItemTooltip, itemButtonIcons, requireEnabledOnly } = listContext
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

    // If the item is enabled, apply regular
    // tooltip addendums.
    if (item.enabled) {
      // Add R-Click prompt, if there
      // are item buttons.
      if (itemButtonIcons.length) {
        if (description) {
          description += '\n\t\n'
        }
        description += `\`L-Click\` to select \n\t\n`
        description += `\`R-Click\` for options`
      }
    }
    // Else add the reason for why the item
    // is disabled.
    else {
      if (item.disabledReason) {
        if (description) {
          description += '\n\t\n'
        }
        description += `*${item.disabledReason}*`
      }
    }

    return description
  })

  /* -- FUNCTIONS -- */

  /**
   * Callback for when the item cell is clicked.
   */
  const onClick = requireEnabledOnly(item, () => {
    if (selection?._id === item._id) setSelection(null)
    else setSelection(item)
  })

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
export type TListItemCell<TItem extends MetisComponent> = {
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
