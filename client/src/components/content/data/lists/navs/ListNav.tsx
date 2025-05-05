import { useEffect, useRef, useState } from 'react'
import ButtonSvgPanel_v2 from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { useListContext } from '../List'
import ListPageControls from '../pages/ListPageControls'
import ListButtons from './ListButtons'
import './ListNav.scss'
import ListProcessor from './ListProcessor'

export default function ListNav(): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const listContext = useListContext()
  const { showButtonMenu } = globalContext.actions
  const { name, elements, state, itemButtons, listButtons } = listContext
  const [buttonOverflowCount] = state.buttonOverflowCount
  const [overflowMenuButtons, setOverflowMenuButtons] = useState<TMetisIcon[]>(
    [],
  )
  const overflowPanel = useRef<HTMLDivElement>(null)

  /* -- FUNCTIONS -- */

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

    showButtonMenu(overflowMenuButtons, () => {}, {
      positioningTarget: overflowButton,
    })
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

  // Render the nav.
  return (
    <div className='ListNav' ref={elements.nav}>
      <div className='ListHeader'>
        <div className='ListHeading'>{name}</div>
      </div>
      <ListPageControls />
      <ListButtons />
      <ButtonSvgPanel_v2
        buttons={['overflow']}
        onButtonClick={() => {
          showOverflowMenu()
        }}
        uniqueClassList={['ListOverflowPanel']}
        getButtonClassList={() => {
          let result = new ClassList()
          result.set('Active', buttonOverflowCount > 0)
          result.set('Inactive', buttonOverflowCount === 0)
          return result
        }}
      />
      <ListProcessor />
    </div>
  )
}
