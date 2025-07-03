import { useEffect, useRef, useState } from 'react'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useEventListener, usePostRenderEffect } from 'src/toolbox/hooks'
import { Output } from '.'
import './OutputPanel.scss'

/* -- CONSTANTS -- */

/**
 * The distance from the bottom of the outputs
 * that the user must be in order for the auto-scroll
 * to be locked.
 */
const AUTO_SCROLL_LOCK_DISTANCE = 100

/* -- COMPONENT -- */

/**
 * A panel for displaying messages in the session.
 */
export default function OutputPanel({
  force,
  selectNode,
}: TOutputPanel_P): JSX.Element {
  /* -- STATE -- */

  const [outputs, setOutputs] = useState<ClientMissionForce['outputs']>([])
  const outputsElm = useRef<HTMLDivElement>(null)
  const smoothScrollInProgress = useRef<boolean>(false)
  const smoothScrollTimeout = useRef<
    NodeJS.Timeout | string | number | undefined
  >()
  const [autoScrollLock, lockAutoScroll] = useState<boolean>(false)
  const [areUnseenOutputs, setAreUnseenOutputs] = useState<boolean>(false)

  /* -- EFFECTS -- */

  // Listen for new outputs.
  useEventListener(force, 'output', () => {
    setOutputs([...force.outputs])
  })

  // Update outputs when force changes.
  useEffect(() => setOutputs(force.outputs), [force.outputs])

  // Scroll to the bottom of the outputs element
  // when outputs change, assuming auto-scroll
  // is not locked.
  usePostRenderEffect(() => {
    if (outputsElm.current && !autoScrollLock) {
      outputsElm.current.scroll({
        top: outputsElm.current.scrollHeight,
        behavior: 'smooth',
      })
      smoothScrollInProgress.current = true
    }

    // Set the unseen outputs flag to
    // the value of the auto-scroll lock.
    setAreUnseenOutputs(autoScrollLock)
  }, [outputs])

  // Locks auto-scroll if the user scrolls up,
  // unlocking it when they scroll back down.
  useEventListener(outputsElm.current, 'scroll', () => {
    // Get the outputs element.
    let element = outputsElm.current

    // Abort if the outputs element is not set.
    if (!element) return

    // Determine the distance from the bottom.
    let distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight

    // Determine if the auto-scroll should be locked.
    lockAutoScroll(
      distanceFromBottom >= AUTO_SCROLL_LOCK_DISTANCE &&
        !smoothScrollInProgress.current,
    )

    // If smooth scroll is in progress, reset the timeout.
    if (smoothScrollInProgress.current) {
      clearTimeout(smoothScrollTimeout.current)
      smoothScrollTimeout.current = setTimeout(() => {
        // Once the timeout completes, set the smooth scroll
        // in progress flag to false.
        smoothScrollInProgress.current = false
      }, 100)
    }
  })

  /* -- COMPUTED -- */

  /**
   * The class name for the view new outputs button.
   */
  const viewNewOutputsClass = compute<string>(() => {
    let classList: string[] = ['ViewNewOutputs']

    // If there are no unseen outputs, add the
    // 'Hidden' class.
    if (!areUnseenOutputs) classList.push('Hidden')

    return classList.join(' ')
  })

  /* -- HANDLERS -- */

  const onViewNewOutputs = () => {
    // Scroll to the bottom of the outputs element.
    outputsElm.current?.scroll({
      top: outputsElm.current.scrollHeight,
      behavior: 'smooth',
    })
    smoothScrollInProgress.current = true

    // Unlock the auto-scroll.
    lockAutoScroll(false)
    // Set the unseen outputs flag to false.
    setAreUnseenOutputs(false)
  }

  /* -- RENDER -- */

  return (
    <div className='OutputPanel'>
      <div className='Outputs' ref={outputsElm}>
        {outputs.map((output) => {
          return (
            <Output
              output={output}
              selectNode={selectNode}
              key={`output-${output._id}_time-${output.time}`}
            />
          )
        })}
      </div>
      <div className='OutputNavigation'>
        <div className={viewNewOutputsClass} onClick={onViewNewOutputs}>
          <div className='Text'>New outputs</div>
          <div className='Icon'></div>{' '}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR OUTPUT PANEL ---------------------------- */

/**
 * Prop type for `OutputPanel`.
 */
type TOutputPanel_P = {
  /**
   * The force to render the message(s) for.
   */
  force: ClientMissionForce
  /**
   * Selects a node.
   * @param node The node to select.
   */
  selectNode: (node: ClientMissionNode | null) => void
}
