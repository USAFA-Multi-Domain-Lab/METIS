import { AnyObject } from 'mongoose'
import { useStore } from 'react-context-hook'
import './Branding.scss'
import Tooltip from './Tooltip'

// This will brand the app with the
// logo.
const Branding = (props: { goHome: () => void }): JSX.Element => {
  return (
    <div className='Branding' onClick={props.goHome}>
      MDL
      <Tooltip description='Go home.' />
    </div>
  )
}

export default Branding
