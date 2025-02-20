import { useCallback, useEffect, useRef, useState } from 'react'
import { TObjectFormSyncOptions, usePostInitEffect } from '.'

/**
 * Maintains states for all provided keys of a provided object,
 * syncing the states with the object, so that the object always
 * reflects the current data stored in the states.
 * @param object The object to sync with the states.
 * @param statefulKeys The keys of the object for which to maintain states.
 * @param options Options for the hook.
 * @returns An object containing the states, indexed by the keys of the object.
 */
export function useObjectFormSync<
  T extends {},
  TIncludedKey extends keyof T & string,
>(
  object: T,
  statefulKeys: Array<TIncludedKey>,
  options: TObjectFormSyncOptions = {},
): { [K in keyof T]: K extends TIncludedKey ? TReactState<T[K]> : never } {
  const { onChange = () => {} } = options
  let [objectState, setObjectState] = useState<Array<any>>(() =>
    statefulKeys.map((key) => object[key]),
  )

  // When the state updates, transfer the state data
  // to the object, keeping it in sync.
  usePostInitEffect(() => {
    for (let i = 0; i < statefulKeys.length; i++) {
      let key = statefulKeys[i]
      let value = objectState[i]
      object[key] = value
    }
    onChange()
  }, [objectState])

  // Construct the state object to return
  // to the caller for use.
  const exposedState: any = {}

  for (let i = 0; i < statefulKeys.length; i++) {
    let key = statefulKeys[i]
    let value = objectState[i]

    exposedState[key] = [
      value,
      // Create a setter for each stateful key.
      (newValue: any) => {
        setObjectState((prevObjectState) => {
          // If the new value has a preprocessing function,
          // call it before setting the new value.
          if (typeof newValue === 'function') {
            newValue = newValue(prevObjectState[i])
          }

          // Create the new object state, replacing the
          // value at the current index with the new value.
          let newObjectState = [...prevObjectState]
          newObjectState[i] = newValue

          // Return the new object state.
          return newObjectState
        })
      },
    ]
  }

  return exposedState
}

/**
 * Allows for programatic forced updates on a component.
 * @returns A function that can be called to force the component to update.
 */
export function useForcedUpdates(): () => void {
  const [, forceRender] = useState({})
  return useCallback(() => {
    forceRender({})
  }, [])
}

/**
 * Adds a preprocessing step before a setter is called.
 * @param state The state to add the preprocessor to. Result of `useState` call.
 * @param preprocess The preprocessing function to call before the actual setter is called.
 * @returns The processed state, including the current value and setter, as normally
 * returned by `useState`.
 */
export function withPreprocessor<T>(
  state: TReactState<T>,
  preprocess: (newValue: TReactSetterArg<T>) => TReactSetterArg<T>,
): TReactState<T> {
  const [value, setValue] = state
  return [
    value,
    (newValue: TReactSetterArg<T>) => {
      setValue(preprocess(newValue))
    },
  ]
}

/**
 * Forces a rerender of the component at a specified,
 * precise interval.
 * @param interval
 */
export function usePeriodicRerender(interval: number) {
  const [, forceRender] = useState({})
  const nextRender = useRef<number>(Date.now() + interval)
  const unmounted = useRef<boolean>(false)

  const getNextInterval = () => nextRender.current - Date.now()

  // Loops as long as the component is mounted,
  // forcing rerenders at the specified interval.
  const loop = () => {
    if (!unmounted.current) {
      forceRender({})
      nextRender.current += interval
      setTimeout(loop, getNextInterval())
    }
  }

  // Create an effect that starts the loop
  // on mount, and stops it on unmount.
  useEffect(() => {
    loop()
    return () => {
      unmounted.current = true
    }
  }, [])
}
