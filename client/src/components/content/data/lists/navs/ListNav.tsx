import { useListContext } from '../List'
import ListPageControls from '../pages/ListPageControls'
import ListFiltering from './ListFiltering'
import './ListNav.scss'

export default function ListNav(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { name } = listContext

  /* -- RENDER -- */

  // Render the nav.
  return (
    <div className='ListNav'>
      <div className='ListHeader'>
        <div className='ListHeading'>{name}</div>
      </div>
      <ListPageControls />
      <ListFiltering />
    </div>
  )
}
