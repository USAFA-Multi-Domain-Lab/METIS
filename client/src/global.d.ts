import React from 'react'

declare global {
  /**
   * What useState returns.
   */
  export type TReactState<T extends any = any> = [T, TReactSetter<T>]

  /**
   * The setter `useState` returns.
   */
  export type TReactSetter<T> = React.Dispatch<React.SetStateAction<T>>

  /**
   * The argument passed to a react setter.
   */
  export type TReactSetterArg<T> = React.SetStateAction<T>

  /**
   * Used by `GenericType` type to infer the type of the generic argument.
   */
  type TWithGeneric<T> = T[]

  /**
   * Infers the type of the first generic argument.
   */
  export type TGenericType<Type> = Type extends TWithGeneric<infer X>
    ? X
    : never
}
