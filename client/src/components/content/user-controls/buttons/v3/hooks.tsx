import { useEffect } from 'react'
import { defaultButtonSvgProps } from './ButtonSvg'
import ButtonSvgEngine from './engines'
import { TButtonSvg_PK, TSvgLayout } from './types'

/**
 * Hook which creates a new button engine for use
 * in a React component.
 */
export function useButtonSvgEngine() {
  return ButtonSvgEngine.use()
}

/**
 * Hook to use a button in a given engine.
 * @param engine The engine in which to use the button.
 * @param initialProps The initial props to use for the button.
 * @note The button can later be modified statefully.
 */
export function useButtonSvg(
  engine: ButtonSvgEngine,
  initialProps: Omit<TButtonSvg_PK, 'key' | 'type'>,
) {
  let icon: TMetisIcon = initialProps.icon ?? defaultButtonSvgProps.icon

  // Maintain `onClick` handler to make
  // sure it is always up to date and using
  // the latest version of the function.
  let current = engine.getButton(
    initialProps.icon ?? defaultButtonSvgProps.icon,
  )
  if (current) current.onClick = initialProps.onClick

  // Add button to the engine.
  useEffect(() => {
    engine.add(initialProps)
    return () => {
      engine.remove(icon)
    }
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
    engine.setLayout(...initialLayout)
  }, [engine])
}
