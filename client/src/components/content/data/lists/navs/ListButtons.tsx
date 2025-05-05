import ButtonSvgPanel_v2 from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { useListContext } from '../List'
import { TListItem } from '../pages/ListItem'
import './ListButtons.scss'

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
  const {
    elements,
    state,
    listButtons,
    itemButtons,
    getListButtonLabel,
    getItemButtonLabel,
    onListButtonClick,
    onItemButtonClick,
  } = listContext
  const [selection] = state.selection
  const [buttonOverflowCount] = state.buttonOverflowCount

  /* -- COMPUTED -- */

  /**
   * The item buttons, but with extra auxillary buttons
   * added.
   */
  const agregatedItemButtons: TMetisIcon[] = ['_blank', ...itemButtons]

  /* -- RENDER -- */

  // Render the buttons.
  return (
    <div className='ListButtons' ref={elements.buttons}>
      <ButtonSvgPanel_v2
        buttons={listButtons}
        onButtonClick={onListButtonClick}
        getTooltip={getListButtonLabel}
        getButtonClassList={(button: TMetisIcon, index: number) => {
          let result: ClassList = new ClassList()
          let adjustedOverflowCount =
            buttonOverflowCount - agregatedItemButtons.length
          let reverseIndex = listButtons.length - index - 1
          result.set('ListButtonOverflow', reverseIndex < adjustedOverflowCount)
          return result
        }}
      />
      <ButtonSvgPanel_v2
        buttons={agregatedItemButtons}
        disableButton={(button) => (Boolean(selection) ? 'none' : 'full')}
        onButtonClick={(button) => {
          if (selection) onItemButtonClick(button, selection)
        }}
        getTooltip={(button) => {
          if (selection) return getItemButtonLabel(button, selection)
          else return ''
        }}
        getButtonClassList={(button: TMetisIcon, index: number) => {
          let result: ClassList = new ClassList()
          let reverseIndex = agregatedItemButtons.length - index - 1
          result.set('ListButtonOverflow', reverseIndex < buttonOverflowCount)
          return result
        }}
      />
    </div>
  )
}
