import ButtonSvgPanel from 'metis/client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'metis/client/components/content/user-controls/buttons/panels/hooks'
import { useEventListener, useInlineStyling } from 'metis/client/toolbox/hooks'
import { useEffect, useState } from 'react'
import { useListContext } from '../../List'
import ListUpload from '../../uploads'
import './ListItemUpload.scss'

/**
 * Renders an instance of {@link ListUpload} as individual
 * item in a list.
 */
export default function ListItemUpload({
  upload,
}: TListItemUpload_P): TReactElement {
  /* -- STATE -- */

  const listContext = useListContext()
  const [progress, setProgress] = useState<number>(upload.progress)
  const [smoothProgress, setSmoothProgress] = useState<number>(progress)

  const buttonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'cancel',
        type: 'button',
        icon: 'cancel',
        onClick: () => upload.cancel(),
        description: 'Cancel upload',
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * The inline styles for the content.
   */
  const contentStyle = useInlineStyling((style) => {
    if (listContext.elements.root.current) {
      let rootElement = listContext.elements.root.current
      let width = rootElement.offsetWidth
      let borderWidth = parseFloat(getComputedStyle(rootElement).borderWidth)

      // Adjust width based on computed border width.
      width -= borderWidth * 2

      style.width = `${width}px`
    }
  })

  /**
   * The inline styles for the progress bar.
   */
  const progressBarStyle = useInlineStyling((style) => {
    // If the node is executing, animate
    // the progress bar.
    style.width = `${smoothProgress}%`
  })

  /* -- EFFECTS -- */

  useEventListener(upload, 'progress', () => {
    setProgress(upload.progress)
  })

  useEffect(() => {
    setTimeout(() => {
      let difference = progress - smoothProgress

      if (Math.abs(difference) < 0.075) {
        setSmoothProgress(progress)
      } else {
        setSmoothProgress((prev) => prev + difference * 0.075)
      }
    }, 5)
  }, [progress, smoothProgress])

  /* -- RENDER -- */

  return (
    <div className='ListItemUpload ListItemLike'>
      <div className='UploadItemContent' style={contentStyle}>
        <div className='UploadProgressBar' style={progressBarStyle}></div>
        <div className='ItemName ItemCellLike'>{upload.name}</div>
        <div className='ProgressNumeric ItemCellLike'>
          {upload.progressFormatted}
        </div>
        <ButtonSvgPanel engine={buttonEngine} />
      </div>
    </div>
  )
}

/**
 * Props for {@link ListItemUpload}.
 */
export type TListItemUpload_P = {
  /**
   * The upload to display.
   */
  upload: ListUpload
}
// const panSmoothly = (destination: Vector2D): void => {
//     // Determine the difference between the camera
//     // position and the destination.
//     let difference = Vector2D.difference(destination, cameraPosition)
//     // Determine the change in position that
//     // must occur this frame in the transition.
//     let delta = difference.scaleByFactor(0.1)
//
//     // Enforce cuttoff points so that the transition
//     // doesn't exponentially slow down with no end.
//     if (Math.abs(delta.x) < 0.003) {
//       cameraPosition.x = destination.x
//     }
//     if (Math.abs(delta.y) < 0.003) {
//       cameraPosition.y = destination.y
//     }
//
//     // If the camera is at the destination, end
//     // the loop.
//     if (cameraPosition.locatedAt(destination)) {
//       return
//     }
//
//     // Translate by delta.
//     cameraPosition.translateBy(delta)
//
//     // Set a timeout for the next frame.
//     setTimeout(() => panSmoothly(destination), 5)
//   }
