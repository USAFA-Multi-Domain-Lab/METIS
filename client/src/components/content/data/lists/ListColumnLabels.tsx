import { compute } from 'src/toolbox'
import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import './ListColumnLabels.scss'

/**
 * Labels for the columns of a `List` component.
 */
export default function ListColumnLabels({
  itemButtonCount,
}: TListColumnLabels): JSX.Element | null {
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
    const classList = ['ItemButtons', 'ColumnLabel', 'ItemCell']

    if (itemButtonCount === 0) classList.push('Hidden')

    return classList.join(' ')
  })

  /**
   * The filler item buttons for the item button label.
   */
  const itemButtonFillers = compute<Array<'_blank'>>(() =>
    new Array(itemButtonCount).fill('_blank'),
  )

  /* -- RENDER -- */

  // Render the list item.
  return (
    <div className={rootClass}>
      <div className='ItemName ColumnLabel ItemCell'>Name</div>
      <div className={itemButtonClass}>
        <ButtonSvgPanel_v2
          buttons={itemButtonFillers}
          size={'small'}
          onButtonClick={() => {}}
        />
      </div>
    </div>
  )
}

/**
 * Props for `ListColumnLabels`.
 */
export type TListColumnLabels = {
  /**
   * The number of item buttons for the list.
   */
  itemButtonCount: number
}
