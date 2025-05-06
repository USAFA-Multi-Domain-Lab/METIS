import { compute } from 'src/toolbox'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { useListContext } from '../List'
import ListPageControls from '../pages/ListPageControls'
import ListButtons from './ListButtons'
import './ListNav.scss'
import ListOverflowPanel from './ListOverflowPanel'
import ListProcessor from './ListProcessor'

export default function ListNav(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { name, elements, state } = listContext
  const [buttonOverflowCount] = state.buttonOverflowCount

  /* -- COMPUTED -- */

  /**
   * Class list for the root element.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('ListNav')
    result.set('Overflowing', buttonOverflowCount > 0)
    return result
  })

  /* -- RENDER -- */

  // Render the nav.
  return (
    <div className={rootClasses.value} ref={elements.nav}>
      <div className='ListHeader'>
        <div className='ListHeading'>{name}</div>
      </div>
      <ListPageControls />
      <ListButtons />
      <ListOverflowPanel />
      <ListProcessor />
    </div>
  )
}
