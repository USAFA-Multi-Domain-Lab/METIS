import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Creates a handler that will be called when the component mounts.
 * @param handler The handler to call when the component mounts. Done will be passed to the handler, which should be called when the handler is done processing the mount.
 * @param dependencies The dependencies to watch for changes.
 * @returns A tuple containing a boolean indicating whether the mount has been handled and a function that can be called to remount the component.
 */
export function useMountHandler(
  handler: (done: () => void) => void,
  dependencies: React.DependencyList = [],
): [boolean, () => void] {
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  useEffect(() => {
    if (!mountHandled) {
      handler(() => setMountHandled(true))
    }
  }, [mountHandled, ...dependencies])

  const remount = useCallback(() => {
    setMountHandled(false)
  }, [])

  return [mountHandled, remount]
}

/**
 * Creates a handler that will only be called during
 * the first render and will not be called on subsequent
 * renders.
 * @param handler The handler to call on the first render.
 */
export function useInitRenderHandler(handler: () => void) {
  const initRender = useRef(true)

  if (initRender.current) {
    handler()
    initRender.current = false
  }
}

/**
 * Creates a handler that will be called when the component unmounts.
 * @param handler The handler that is called upon unmount.
 * @returns Whether the component will unmount, changes after handler is called.
 */
export function useUnmountHandler(handler: () => void): boolean {
  const unmounted = useRef<boolean>(false)

  useEffect(() => {
    return () => {
      handler()
      unmounted.current = true
    }
  }, [])

  return unmounted.current
}

/**
 * Works like `useEffect`, but the callback will not be called
 * on the initial render.
 * @param effect Imperative function that can return a cleanup function
 * @param deps If present, effect will only activate if the values in the list change.
 */
export function usePostInitEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList | undefined,
): void {
  // Tracks whether the component has been initialized.
  const initialized = useRef(false)

  // Call use effect, calling and returning result
  // of the callback only after the component has
  // been initialized.
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    } else {
      return effect()
    }
  }, deps)
}

/**
 * Works like `useEffect`, but the callback will not be called
 * until after the component has rendered.
 * @param effect Imperative function that can return a cleanup function
 * @param deps If present, effect will only activate if the values in the list change.
 */
export function usePostRenderEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList | undefined,
): void {
  // State to force the component to rerender to
  // trigger the effect.
  const [forcedUpdate, forceRender] = useState({})

  // Pre-render effect to force rerender.
  useEffect(() => {
    forceRender({})
  }, deps)

  // Post-render effect to call the effect.
  useEffect(effect, [forcedUpdate])
}
