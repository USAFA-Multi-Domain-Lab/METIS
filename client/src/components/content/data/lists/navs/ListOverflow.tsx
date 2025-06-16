import { useEffect } from 'react'
import { useButtonMenuEngine } from 'src/components/content/user-controls/buttons/ButtonMenu'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/v3/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/v3/hooks'
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
  const overflowEngine = useButtonMenuEngine({
    elements: aggregatedButtons,
    layout: aggregateButtonLayout,
    dependencies: aggregatedButtonIcons,
  })
  const buttonEngine = useButtonSvgEngine({
    elements: [
      {
        type: 'button',
        icon: 'overflow',
        onClick: () => showOverflowMenu(),
      },
    ],
  })

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
      '.ListOverflow .ButtonSvgPanel .ButtonSvg_overflow',
    )

    if (!overflowButton) {
      console.warn('ListNav: overflowButton is null')
      return
    }

    showButtonMenu(overflowEngine, {
      positioningTarget: overflowButton,
    })
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

  useEffect(() => {
    buttonEngine.modifyClassList('overflow', (classList: ClassList) =>
      classList.switch('Active', 'Inactive', overflowActive),
    )
  }, [overflowActive])

  /* -- RENDER -- */

  return (
    <div className='ListOverflow' ref={elements.overflow}>
      <ButtonSvgPanel engine={buttonEngine} />
    </div>
  )
}
