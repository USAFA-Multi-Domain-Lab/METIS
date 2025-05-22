import { useEffect } from 'react'
import { useButtonMenuEngine } from 'src/components/content/user-controls/buttons/ButtonMenu'
import ButtonSvgPanel_v2 from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context/global'
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
    itemButtonIcons,
    aggregatedButtonIcons,
    aggregatedButtons,
    aggregateButtonLayout,
  } = listContext
  const [selection] = state.selection
  const [buttonOverflowCount] = state.buttonOverflowCount
  const [overflowActive, setOverflowActive] = state.overflowActive
  const overflowEngine = useButtonMenuEngine(
    aggregatedButtons,
    aggregateButtonLayout,
    aggregatedButtonIcons,
  )

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
      '.ListOverflow .ButtonSvg',
    )

    if (!overflowButton) {
      console.warn('ListNav: overflowButton is null')
      return
    }

    showButtonMenu(overflowEngine, {
      positioningTarget: overflowButton,
    })
  }

  /**
   * @returns The class list for the overflow button.
   */
  const getButtonClassList = () => {
    return new ClassList().switch('Active', 'Inactive', overflowActive)
  }

  /* -- EFFECTS -- */

  // Enable/disable overflow item buttons
  // when the selection changes.
  useEffect(() => {
    // Enable/disable any buttons when the
    // selection changes.
    itemButtonIcons.forEach((icon) =>
      overflowEngine.setDisabled(icon, !selection),
    )
  }, [selection])

  // Update the list of overflowing buttons
  // in the overflow menu when the overflow
  // count changes.
  useEffect(() => {
    let threshold = aggregatedButtonIcons.length - buttonOverflowCount
    aggregatedButtonIcons.forEach((icon, index) => {
      overflowEngine.setHidden(icon, index < threshold)
    })
    setOverflowActive(buttonOverflowCount > 0)
  }, [buttonOverflowCount])

  /* -- RENDER -- */

  return (
    <div className='ListOverflow' ref={elements.overflow}>
      <ButtonSvgPanel_v2
        buttons={['overflow']}
        onButtonClick={showOverflowMenu}
        getButtonClassList={getButtonClassList}
      />
    </div>
  )
}
