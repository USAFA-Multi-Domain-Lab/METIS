import { useEffect } from 'react'
import { compute } from 'src/toolbox'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { useListContext } from '../List'
import ListButtons from './ListButtons'
import './ListNav.scss'
import ListOverflow from './ListOverflow'
import ListProcessor from './ListProcessor'

export default function ListNav(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { name, elements, state } = listContext
  const [overflowActive] = state.overflowActive

  /* -- COMPUTED -- */

  /**
   * Class list for the root element.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('ListNav')
    result.set('Overflowing', overflowActive)
    return result
  })

  /* -- EFFECTS -- */

  // Update the column count of the nav in
  // the CSS to respond to the overflow state.
  useEffect(() => {
    let navElement = elements.nav.current

    if (!navElement) {
      console.warn('ListNav: navElement is null')
      return
    }

    let autoColumnCount = overflowActive ? 3 : 2

    navElement.style.setProperty(
      '--auto-column-count',
      autoColumnCount.toString(),
    )
  }, [overflowActive])

  /* -- RENDER -- */

  // Render the nav.
  return (
    <div className={rootClasses.value} ref={elements.nav}>
      <div className='ListHeader'>
        <div className='ListHeading'>{name}</div>
      </div>
      <ListButtons />
      <ListOverflow />
      <ListProcessor />
    </div>
  )
}
