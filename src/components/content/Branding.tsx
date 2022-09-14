import { useStore } from 'react-context-hook'
import './Branding.scss'
import Tooltip from './Tooltip'

// This will brand the app with the
// logo.
const Branding = (): JSX.Element => {
  const [currentPagePath, setCurrentPagePath] =
    useStore<string>('currentPagePath')

  const goHome = (): void => {
    setCurrentPagePath('DashboardPage')
  }

  return (
    <div className='Branding' onClick={goHome}>
      MDL
      <Tooltip description='Go home.' />
    </div>
  )
}

export default Branding
