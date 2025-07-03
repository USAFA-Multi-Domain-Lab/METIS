import { useEffect } from 'react'
import SvgButton from './button-svg'
import ButtonSvgEngine from './engines'
import SvgStepper from './stepper-svg'
import { TButtonSvgEngine, TButtonSvgFlow, TSvgLayout } from './types'

/**
 * Hook which creates a new button engine for use
 * in a React component. Options passed will initialize
 * the engine for use and not be used again, unless a new
 * engine is created. All changes to the engine must be
 * made statefully via the methods available in {@link ButtonSvgEngine}.
 * @param buttons The initial buttons to add to the engine.
 * @param options The initial options with which to configure the engine.
 * @param dependencies The dependencies to use for the engine, creating
 * a new engine if any of them change.
 */
export function useButtonSvgEngine({
  elements,
  options,
  dependencies,
}: TButtonSvgEngine) {
  return ButtonSvgEngine.use({ elements, options, dependencies })
}

/**
 * Hook to use a button in a given engine.
 * @param engine The engine in which to use the button.
 * @param initialProps The initial props to use for the element.
 * @note The element can later be modified statefully.
 */
export function useButtonSvgs(
  engine: ButtonSvgEngine,
  ...initialProps: Required<TButtonSvgEngine>['elements']
) {
  // Update necessary properties of the elements
  // based on the type of the element.
  // *** Note: This is necessary to ensure that the elements
  // *** are properly configured when added to the engine
  // *** because some properties are dynamic and change based
  // *** on the state where the element is rendered.
  initialProps.forEach((element) => {
    const { icon, type } = element
    let current = engine.get(icon ?? SvgButton.DEFAULT_PROPS.icon)

    if (type === 'button' && current instanceof SvgButton) {
      if (element.onClick) current.onClick = element.onClick
      else current.onClick = () => {}
    }

    if (type === 'stepper' && current instanceof SvgStepper) {
      if (element.value) current.value = element.value
      else current.value = SvgStepper.DEFAULT_PROPS.value
      if (element.maximum) current.maximum = element.maximum
      else current.maximum = SvgStepper.DEFAULT_PROPS.maximum
    }
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
