import { useListContext } from './List'
import './ListDropBox.scss'

/**
 * A dropbox for uploading files to a list.
 * @note This component is only used when a
 * callback for dropping files is provided to
 * the list.
 */
export default function (): TReactElement | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { onFileDrop } = listContext

  /* -- RENDER -- */

  // Abort if no callback is provided.
  if (!onFileDrop) return null

  return (
    <div className='ListDropBox'>
      <div className='UploadIcon'></div>
    </div>
  )
}
