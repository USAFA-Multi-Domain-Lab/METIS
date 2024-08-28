import React from 'react'

declare global {
  /**
   * What useState returns.
   */
  export type TReactState<T extends any = any> = [
    T,
    React.Dispatch<React.SetStateAction<T>>,
  ]

  /**
   * The setter `useState` returns.
   */
  export type ReactSetter<T> = React.Dispatch<React.SetStateAction<T>>

  /**
   * Used by `GenericType` type to infer the type of the generic argument.
   */
  type TypeWithGeneric<T> = T[]

  /**
   * Infers the type of the first generic argument.
   */
  export type GenericType<Type> = Type extends TypeWithGeneric<infer X>
    ? X
    : never
}
