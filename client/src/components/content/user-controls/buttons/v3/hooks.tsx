import { useEffect } from 'react'
import ButtonSvgEngine from './engines'
import {
  TButtonSvg_Input,
  TButtonSvgFlow,
  TButtonSvgPanelOptions,
  TSvgLayout,
} from './types'

/**
 * Hook which creates a new button engine for use
 * in a React component.
 * @param buttons The buttons to add to the engine.
 * @param options The options with which to configure the engine.
 * @param dependencies The dependencies to use for the engine, creating
 * a new engine if any of them change.
 */
export function useButtonSvgEngine(
  buttons?: TButtonSvg_Input[],
  options?: TButtonSvgPanelOptions,
  dependencies?: any[],
) {
  return ButtonSvgEngine.use(buttons, options, dependencies)
}

/**
 * Hook to use a button in a given engine.
 * @param engine The engine in which to use the button.
 * @param initialProps The initial props to use for the button.
 * @note The button can later be modified statefully.
 */
export function useButtonSvgs(
  engine: ButtonSvgEngine,
  ...initialProps: TButtonSvg_Input[]
) {
  // Maintain `onClick` handlers to make
  // sure it is always up to date and using
  // the latest version of the callbacks.
  initialProps.forEach((button) => {
    let current = engine.getButton(
      button.icon ?? ButtonSvgEngine.DEFAULT_BUTTON_PROPS.icon,
    )
    if (current && button.onClick) current.onClick = button.onClick
    else if (current) current.onClick = () => {}
  })

  // Add buttons to the engine.
  useEffect(() => {
    engine.add(...initialProps)
  }, [engine])
}

/**
 * Hook which applies the given layout to the given engine.
 * @param engine The engine to which to apply the layout.
 * @param initialLayout The initial layout to apply to the engine.
 * @note The layout can later be modified statefully.
 * @throws Error if the engine already has a custom layout, possibly
 * from a duplicate call to this hook.
 */
export function useButtonSvgLayout(
  engine: ButtonSvgEngine,
  ...initialLayout: TSvgLayout
): void {
  useEffect(() => {
    if (engine.hasCustomLayout) {
      throw new Error(
        '`useLayout` hook was called but the engine already had a custom layout initialized elsewhere.',
      )
    }
    engine.layout = initialLayout
  }, [engine])
}

/**
 * Hook which applies the given flow to the given engine.
 * @param engine The engine to which to apply the flow.
 * @param flow The flow to apply to the engine.
 * @note The flow can later be modified statefully.
 */
export function useButtonSvgFlow(
  engine: ButtonSvgEngine,
  flow: TButtonSvgFlow,
): void {
  useEffect(() => {
    engine.flow = flow
  }, [engine])
}
