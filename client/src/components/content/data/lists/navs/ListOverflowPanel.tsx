import { useEffect, useState } from 'react'
import ButtonSvgPanel_v2 from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { useListContext } from '../List'

/**
 * A panel in a `ListNav` that will display a button
 * that reveals overflowing content in the navigation.
 * If the viewport is too small to display all content
 * in the navigation, this panel will allow the content
 * to still be accessible via a button menu.
 */
export default function (): JSX.Element | null {
  const globalContext = useGlobalContext()
  const listContext = useListContext()
  const { showButtonMenu } = globalContext.actions
  const {
    elements,
    state,
    itemButtons,
    listButtons,
    onListButtonClick,
    onItemButtonClick,
    getItemButtonLabel,
    getListButtonLabel,
  } = listContext
  const [selection] = state.selection
  const [buttonOverflowCount] = state.buttonOverflowCount
  const [overflowMenuButtons, setOverflowMenuButtons] = useState<TMetisIcon[]>(
    [],
  )

  /* -- FUNCTIONS -- */

  /**
   * @param button The button from which the source
   * is determined.
   * @returns The source of the button, whether from
   * the list buttons or the item buttons.
   */
  const determineButtonSource = (button: TMetisIcon): TListButtonSource => {
    if (listButtons.includes(button)) {
      return 'list'
    } else if (itemButtons.includes(button)) {
      return 'item'
    } else {
      console.warn('ListOverflowPanel: button source could not be determined.')
      return 'none'
    }
  }

  /**
   * Reveals the overflow menu to the user.
   */
  const showOverflowMenu = () => {
    let navElement = elements.nav.current

    if (!navElement) {
      console.warn('ListNav: navElement is null')
      return
    }

    let overflowButton = navElement.querySelector<HTMLDivElement>(
      '.ListOverflowPanel .ButtonSvg',
    )

    if (!overflowButton) {
      console.warn('ListNav: overflowButton is null')
      return
    }

    showButtonMenu(
      overflowMenuButtons,
      (button) => {
        let source = determineButtonSource(button)

        switch (source) {
          case 'list':
            onListButtonClick(button)
            break
          case 'item':
            if (selection) onItemButtonClick(button, selection)
            break
        }
      },
      {
        positioningTarget: overflowButton,
        getDescription: (button) => {
          let source = determineButtonSource(button)

          switch (source) {
            case 'list':
              return getListButtonLabel(button)
            case 'item':
              if (selection) return getItemButtonLabel(button, selection)
              else return ''
            default:
              return ''
          }
        },
      },
    )
  }

  /**
   * @returns The class list for the overflow button.
   */
  const getButtonClassList = () => {
    let result = new ClassList()
    result.set('Active', buttonOverflowCount > 0)
    result.set('Inactive', buttonOverflowCount === 0)
    return result
  }

  /* -- EFFECTS -- */

  // Update the overflow menu buttons when the
  // button overflow count changes.
  useEffect(() => {
    let count = buttonOverflowCount
    let buttons: TMetisIcon[] = [...listButtons, '_blank', ...itemButtons]
    let sliceStart = buttons.length - count
    let overflowMenuButtons = buttons.slice(sliceStart)
    overflowMenuButtons = overflowMenuButtons.filter(
      (button) => button !== '_blank',
    )
    setOverflowMenuButtons(overflowMenuButtons)
  }, [buttonOverflowCount])

  /* -- RENDER -- */

  return (
    <ButtonSvgPanel_v2
      buttons={['overflow']}
      onButtonClick={showOverflowMenu}
      uniqueClassList={['ListOverflowPanel']}
      getButtonClassList={getButtonClassList}
    />
  )
}

/* -- TYPES -- */

/**
 * A classification for a button in a list which
 * defines whether the button is a list button or
 * an item button.
 */
export type TListButtonSource = 'list' | 'item' | 'none'
