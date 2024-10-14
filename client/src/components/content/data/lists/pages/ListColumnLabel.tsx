import { compute } from 'src/toolbox'
import { TListColumnType } from '../List'
import './ListColumnLabel.scss'
import { TListItem } from './ListItem'

/**
 * A label for a column of a `List` component.
 */
export default function ListColumnLabel<TItem extends TListItem>({
  column,
  text,
}: TListColumnLabel<TItem>): JSX.Element | null {
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

    return classList.join(' ')
  })

  /* -- RENDER -- */

  // Render the column label.
  return <div className={rootClass}>{text}</div>
}

/**
 * Props for `ListColumnLabel`.
 */
export type TListColumnLabel<TItem extends TListItem> = {
  /**
   * The column associated with the label.
   */
  column: TListColumnType<TItem>
  /**
   * The text to display in the column label.
   */
  text: string
}
