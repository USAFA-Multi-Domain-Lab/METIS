import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import { TList_P, useListContext } from './List'
import './ListButtons.scss'
import { TListItem } from './pages/ListItem'

/**
 * Provides buttons to the `List` component
 * so that the user can perform operations
 * on the list.
 */
export default function ListButtons<
  TItem extends TListItem,
>(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const { listButtons, getListButtonTooltip, onListButtonClick } = listContext

  /* -- RENDER -- */

  // Render the buttons.
  return (
    <div className='ListButtons'>
      <ButtonSvgPanel_v2
        buttons={listButtons}
        size={'regular'}
        getTooltip={getListButtonTooltip}
        onButtonClick={onListButtonClick}
      />
    </div>
  )
}

/**
 * Props for `ListButtons`.
 */
export type TListButtons_P<TItem extends TListItem> = {
  /**
   * The buttons to display in the list.
   * @default []
   */
  buttons: TList_P<TItem>['listButtons']
  /**
   * Gets the tooltip for a button.
   * @param button The button for which to get the tooltip.
   * @returns The tooltip description.
   * @default () => ''
   */
  getButtonTooltip?: TList_P<TItem>['getListButtonTooltip']
  /**
   * The callback for when a button is clicked.
   * @default () => {}
   */
  onButtonClick?: TList_P<TItem>['onListButtonClick']
}
