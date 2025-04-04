import React, {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { compute } from 'src/toolbox'
import { useMountHandler, useUnmountHandler } from 'src/toolbox/hooks'
import ClassList from '../../../../../../shared/toolbox/html/class-lists'
import Panel from './Panel'
import './PanelLayout.scss'

/**
 * The width in pixels of the resize bar between
 * the panels.
 */
const RESIZE_BAR_WIDTH: number = 10 /*px*/

/**
 * Creates a relationship between two panels, allowing
 * them to be resized relative to each other via mouse
 * dragging.
 */
export default function ({
  children,
  initialSizes,
  minSizes = [330, 330],
}: TPanelLayout_P): JSX.Element | null {
  /* -- STATE -- */

  const sizingMode = useMemo<TPanelSizingMode>(() => {
    if (initialSizes[0] === 'fill') {
      return '[auto, fixed]'
    } else if (initialSizes[1] === 'fill') {
      return '[fixed, auto]'
    } else {
      throw new Error(
        'One of the sizes must be a number and the other must be "fill".',
      )
    }
  }, [])
  const [definedSize, setDefinedSize] = useState<number>(() => {
    let size1 = initialSizes[0]
    let size2 = initialSizes[1]

    if (typeof size1 === 'number') {
      return size1
    } else if (typeof size2 === 'number') {
      return size2
    } else {
      throw new Error(
        'One of the sizes must be a number and the other must be "fill".',
      )
    }
  })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [prevWindowWidth, setPrevWindowWidth] = useState<number>(0)
  const stateRef = useRef({
    isDragging,
    definedSize,
    prevWindowWidth,
  })
  const panelLayoutElm = useRef<HTMLDivElement>(null)
  const resizeBarElm = useRef<HTMLDivElement>(null)

  /* -- EFFECTS -- */

  // On mount, register window-level event listeners.
  useMountHandler((done) => {
    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onWindowMouseUp)
    window.addEventListener('resize', onWindowResize)

    setPrevWindowWidth(window.innerWidth)

    done()
  })

  // On unmount, unregister window-level event listeners.
  useUnmountHandler(() => {
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('resize', onWindowResize)
  })

  useEffect(() => {
    stateRef.current = {
      isDragging,
      definedSize,
      prevWindowWidth,
    }
  }, [isDragging, definedSize, prevWindowWidth])

  /* -- FUNCTIONS -- */

  /**
   * Callback for a 'dragstart' event on
   * the resize bar.
   */
  const onDragStart = (): void => {
    setIsDragging(true)
  }

  /**
   * Callback for a 'dragend' event on
   * the resize bar.
   */
  const onDragEnd = (): void => {
    setIsDragging(false)
  }

  /**
   * Callback for a 'mousemove' event on
   * the window.
   * @param event The mouse event.
   */
  const onWindowMouseMove = (event: MouseEvent): void => {
    let { isDragging, definedSize } = stateRef.current
    let layoutElm: HTMLDivElement | null = panelLayoutElm.current
    let resizeElm: HTMLDivElement | null = resizeBarElm.current

    if (layoutElm && resizeElm && isDragging) {
      let [primaryMinSize, secondaryMinSize] = minSizes
      let layoutWidth: number = layoutElm.offsetWidth
      let resizeBarWidth: number = RESIZE_BAR_WIDTH
      let resizeBarX: number = resizeElm.offsetLeft
      let mouseX: number = event.clientX
      let deltaX: number = mouseX - resizeBarX

      if (deltaX > 0) {
        deltaX = Math.max(0, deltaX - resizeBarWidth)
      }

      switch (sizingMode) {
        case '[auto, fixed]':
          definedSize -= deltaX

          if (definedSize < secondaryMinSize) {
            definedSize = secondaryMinSize
          } else if (
            definedSize >
            layoutWidth - resizeBarWidth - primaryMinSize
          ) {
            definedSize = layoutWidth - resizeBarWidth - primaryMinSize
          }
          break
        case '[fixed, auto]':
          definedSize += deltaX

          if (definedSize < primaryMinSize) {
            definedSize = primaryMinSize
          } else if (
            definedSize >
            layoutWidth - resizeBarWidth - secondaryMinSize
          ) {
            definedSize = layoutWidth - resizeBarWidth - secondaryMinSize
          }
          break
      }

      setDefinedSize(definedSize)
    }
  }

  /**
   * Callback for a 'resize' event on the window.
   * @param event The resize event.
   */
  const onWindowResize = (event: UIEvent): void => {
    let layoutElm: HTMLDivElement | null = panelLayoutElm.current

    if (layoutElm) {
      let { prevWindowWidth, definedSize } = stateRef.current
      let currentWindowWidth: number = window.innerWidth
      let layoutWidth: number = layoutElm.offsetWidth
      let resizeBarWidth: number = RESIZE_BAR_WIDTH
      let deltaWindowWidth: number = currentWindowWidth - prevWindowWidth
      let newDefinedSize: number = definedSize
      let previousAutoSize: number =
        layoutWidth - resizeBarWidth - newDefinedSize
      let currentAutoSize: number = previousAutoSize + deltaWindowWidth
      let undersizedAmount: number = 0
      let [primaryMinSize, secondaryMinSize] = minSizes

      switch (sizingMode) {
        case '[auto, fixed]':
          if (currentAutoSize < primaryMinSize) {
            undersizedAmount = primaryMinSize - currentAutoSize
            newDefinedSize -= undersizedAmount

            if (newDefinedSize < secondaryMinSize) {
              newDefinedSize = secondaryMinSize
            }
          }
          break
        case '[fixed, auto]':
          if (currentAutoSize < secondaryMinSize) {
            undersizedAmount = secondaryMinSize - currentAutoSize
            newDefinedSize -= undersizedAmount

            if (newDefinedSize < primaryMinSize) {
              newDefinedSize = primaryMinSize
            }
          }
      }

      setDefinedSize(newDefinedSize)
      setPrevWindowWidth(window.innerWidth)
    }
  }

  /**
   * Callback for a 'mouseup' event on the window.
   * @param event The mouse event.
   */
  const onWindowMouseUp = (): void => {
    onDragEnd()
  }

  /* -- VALIDATION -- */

  let panels = Children.toArray(children)

  // Verify that both children are `Panel` component
  // instances.
  for (let panel of panels) {
    if (!isValidElement(panel)) {
      throw new Error('PanelLayout children must both be an instance of Panel.')
    }
    if (panel.type !== Panel) {
      throw new Error('PanelLayout children must both be an instance of Panel.')
    }
  }

  // Verify there are exactly two children.
  if (panels.length !== 2) {
    throw new Error('PanelLayout must have exactly two children.')
  }

  /* -- COMPUTED -- */

  /**
   * The classes for the root element of
   * the component.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('PanelLayout')
    result.set('IsDragging', isDragging)
    return result
  })

  /**
   * The style for the root element of the
   * component.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    let result: React.CSSProperties = {}
    let primarySize: string = ''
    let secondarySize: string = ''

    // Determine the size of the two panels based
    // on the sizing mode and the defined size.
    switch (sizingMode) {
      case '[auto, fixed]':
        primarySize = '1fr'
        secondarySize = `${definedSize}px`
        break
      case '[fixed, auto]':
        primarySize = `${definedSize}px`
        secondarySize = '1fr'
        break
    }

    result.gridTemplateColumns = `${primarySize} auto ${secondarySize}`

    return result
  })

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value} style={rootStyle} ref={panelLayoutElm}>
      {panels[0]}
      <div
        className={'ResizeBar'}
        onMouseDown={onDragStart}
        ref={resizeBarElm}
      ></div>
      {panels[1]}
    </div>
  )
}

/**
 * Prop type for `PanelLayout`.
 */
export interface TPanelLayout_P {
  /**
   * The children of the component. This should be
   * exactly two `Panel` component instances.
   * @example
   * // This will render properly
   * <PanelLayout>
   *  <Panel>Panel 1</Panel>
   *  <Panel>Panel 2</Panel>
   * </PanelLayout>
   *
   * // This will throw an error.
   * <PanelLayout>
   *  <Panel>Panel 1</Panel>
   *  <Panel>Panel 2</Panel>
   *  <Panel>Panel 3</Panel>
   * </PanelLayout>
   *
   * // This will throw an error.
   * <PanelLayout>
   *  <Panel>Panel 1</Panel>
   *  <div className='Panel'>Panel 2</div>
   * </PanelLayout>
   */
  children: React.ReactNode
  /**
   * The initial size of the panels.
   * @note The first value in the array is the
   * size of the first panel, and the second value
   * is the size of the second panel. One of the
   * values must be a fixed size, and the other
   * value must be 'fill'.
   * @example
   * // This will set the first panel to 200px
   * // and the second panel to fill the rest of
   * // the available space.
   * <PanelLayout initialSizes={[200, 'fill']}>
   *  <Panel>Panel 1</Panel>
   *  <Panel>Panel 2</Panel>
   * </PanelLayout>
   */
  initialSizes: [number, 'fill'] | ['fill', number]
  /**
   * The minimum size of the panels in pixels.
   * @note This is used to prevent the panels
   * from being resized to a size smaller than
   * this value.
   * @note The first value in the array is the
   * minimum size of the first panel, and the
   * second value is the minimum size of the
   * second panel.
   * @example
   * // This will set the minimum size of the
   * // first panel to 400px and the second
   * // panel to 300px.
   * <PanelLayout initialDefinedSize={[400px, 300px]}>
   *  <Panel>Panel 1</Panel>
   *  <Panel>Panel 2</Panel>
   * </PanelLayout>
   * @default [330, 330]
   */
  minSizes?: [number, number]
}

/**
 * A status that indicates whether the panel is
 * a part of a layout, and if so, whether it is the
 * primary or secondary panel in the layout.
 * @option 'isolated' The panel has no layout.
 * @option 'primary' The panel is the primary
 *         panel in a panel layout.
 * @option 'secondary' The panel is the secondary
 *         panel in a panel layout.
 */
export type TPanelLayoutStatus = 'isolated' | 'primary' | 'secondary'

/**
 * A valid size for a panel in a panel layout.
 * @option `number` This will be the size of the panel in pixels.
 * @option 'fill' This will fill all available space.
 */
export type TPanelSize = number | 'fill'

/**
 * The sizing mode of the panel layout, which
 * is inferred from the initial panel sizes.
 */
export type TPanelSizingMode = '[fixed, auto]' | '[auto, fixed]'
