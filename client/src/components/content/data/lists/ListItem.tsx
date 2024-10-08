import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import { TButtonSvgType } from '../../user-controls/buttons/ButtonSvg'
import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import { TList_P } from './List'
import './ListItem.scss'

/**
 * A list item in a `List` component.
 */
export default function ListItem<T extends TListItem>({
  item,
  buttons = [],
  getItemTooltip = () => '',
  getItemButtonTooltip = () => '',
  onSelection,
  onButtonClick = () => {},
}: TListItem_P<T>): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The tooltip description for the item.
   */
  const itemTooltipDescription = compute<string>(() => getItemTooltip(item))

  /**
   * Root class name for the component.
   */
  const rootClass = compute<string>(() => {
    const classList = ['ListItem', 'ListItemLike']

    // Add 'Selectable' class if a click callback
    // is provided.
    if (onSelection) classList.push('Selectable')

    return classList.join(' ')
  })

  /* -- RENDER -- */

  // Render the list item.
  return (
    <div className={rootClass}>
      <div
        className='ItemName ItemCell'
        onClick={() => {
          if (onSelection) onSelection(item)
        }}
      >
        {item.name}
        <Tooltip description={itemTooltipDescription} />
      </div>
      <div className='ItemButtons ItemCell'>
        <ButtonSvgPanel_v2
          buttons={buttons}
          size={'small'}
          onButtonClick={(button) => onButtonClick(button, item)}
          getTooltip={(button) => getItemButtonTooltip(button, item)}
        />
      </div>
    </div>
  )
}

/**
 * Props for `ListItem`.
 */
export type TListItem_P<T extends TListItem> = {
  /**
   * The item to display.
   */
  item: T
  /**
   * Gets the tooltip description for the item.
   * @param item The item for which to get the tooltip.
   * @returns The tooltip description.
   * @default () => ''
   */
  getItemTooltip?: TList_P<T>['getItemTooltip']
  /**
   * Gets the tooltip description for the item's button.
   */
  getItemButtonTooltip?: TList_P<T>['getItemButtonTooltip']
  /**
   * The buttons to display for the item.
   */
  buttons?: TList_P<T>['itemButtons']
  /**
   * Callback for when the item is selected.
   */
  onSelection?: TList_P<T>['onSelection']
  /**
   * Callback for when a button is clicked.
   */
  onButtonClick?: TList_P<T>['onItemButtonClick']
}

/**
 * An object that is compatible with the List component
 * as an item.
 * @note Implement this interface in a class in order
 * to make the class compatible with the List component.
 */
export type TListItem = {
  /**
   * The ID of the item.
   */
  _id: string
  /**
   * The name of the item.
   */
  name: string
}

/**
 * Gets the tooltip description for the item.
 * @param item The item for which to get the tooltip.
 * @returns The tooltip description.
 */
export type TGetItemTooltip<TItem extends TListItem> = (item: TItem) => string

/**
 * Gets the tooltip description for the item's button.
 * @param button The button for which to get the tooltip.
 * @param item The item for which to get the tooltip.
 * @returns The tooltip description.
 */
export type TGetItemButtonTooltip<TItem extends TListItem> = (
  button: TButtonSvgType,
  item: TItem,
) => string

/**
 * A callback for when an item in the list is clicked.
 * @param item The item that was clicked.
 */
export type TOnItemSelection<TItem extends TListItem> = (item: TItem) => void

/**
 * A callback for when a button for an item is clicked.
 * @param item The item with which the button is associated.
 * @param button The type of button clicked.
 */
export type TOnItemButtonClick<TItem extends TListItem> = (
  button: TButtonSvgType,
  item: TItem,
) => void
