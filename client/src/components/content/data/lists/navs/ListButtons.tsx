import ButtonSvgPanel_v2 from '../../../user-controls/buttons/ButtonSvgPanel_v2'
import { TList_P, useListContext } from '../List'
import './ListButtons.scss'
import { TListItem } from '../pages/ListItem'
import ButtonSvg, {
  TButtonSvgType,
} from 'src/components/content/user-controls/buttons/ButtonSvg'
import ButtonMenuController from 'src/components/content/user-controls/buttons/ButtonMenuController'
import { useGlobalContext } from 'src/context'

/**
 * Provides buttons to the `List` component
 * so that the user can perform operations
 * on the list.
 */
export default function ListButtons<
  TItem extends TListItem,
>(): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const listContext = useListContext<TItem>()
  const { showButtonMenu } = globalContext.actions
  const { list, listButtons, getListButtonTooltip, onListButtonClick } =
    listContext

  /* -- FUNCTIONS -- */

  /**
   * Handles the click event for the item
   * options button.
   */
  const onOptionsClick = (event: React.MouseEvent) => {
    showButtonMenu(listButtons, onListButtonClick, {
      positioningTarget: event.target as HTMLDivElement,
      getDescription: getListButtonTooltip,
    })
  }

  /* -- RENDER -- */

  // Render the buttons.
  return (
    <div className='ListButtons'>
      <ButtonSvg
        type='options'
        size='small'
        onClick={onOptionsClick}
        description={'View option menu'}
      />
    </div>
  )
}
