import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import { TList_P } from './List'
import './ListButtons.scss'
import { TListItem } from './ListItem'

/**
 * Provides buttons to the `List` component
 * so that the user can perform operations
 * on the list.
 */
export default function ListButtons<TItem extends TListItem>({
  buttons = [],
  getButtonTooltip = () => '',
  onButtonClick = () => {},
}: TListButtons_P<TItem>): JSX.Element | null {
  // Render the buttons.
  return (
    <div className='ListButtons'>
      <ButtonSvgPanel_v2
        buttons={buttons}
        size={'regular'}
        getTooltip={getButtonTooltip}
        onButtonClick={onButtonClick}
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
