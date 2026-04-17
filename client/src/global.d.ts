import type React from 'react'
import type { JSX } from 'react'

declare global {
  /**
   * Represents an element written in React JSX.
   */
  export type TReactElement = JSX.Element

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
  export type TGenericType<Type> =
    Type extends TWithGeneric<infer X> ? X : never

  /**
   * Creates a union type with the given type
   * and `null`.
   * @type T The type with which to create the union.
   * @returns The union type, with `null`.
   * @example
   * ```ts
   * type T = TWithNull<string>
   * // T = string | null
   * ```
   */
  export type TNullable<T> = T | null
}
