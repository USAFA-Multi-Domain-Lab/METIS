import { useGlobalContext } from '@client/context/global'
import './DevOptions.scss'

export function DevOptions(): TReactElement | null {
  const globalContext = useGlobalContext()
  const [devOptionsActive, setDevOptionsActive] = globalContext.devOptionsActive

  if (!devOptionsActive) return null

  return (
    <div className='DevOptions'>
      <div className='DevOptionsOverlay'>
        <div className='DevOptionsModal'>
          <h2>Debug Options</h2>
          <div onClick={() => setDevOptionsActive(false)}>x</div>
        </div>
      </div>
    </div>
  )
}
