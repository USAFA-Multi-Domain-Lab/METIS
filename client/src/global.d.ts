import React from 'react'

declare global {
  /**
   * What useState returns.
   */
  export type TReactState<T extends any = any> = [
    T,
    React.Dispatch<React.SetStateAction<T>>,
  ]
}
