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

  /**
   * Valid icons to use in the application.
   * @note These are all SVG icons that are stored
   * in the `src/assets/icons` directory. New icons
   * should be added there.
   * ### Special Types
   * - `'_blank'`: Does not do anything and cannot be seen.
   * Acts as a filler when the space needs to be
   * filled up, but no button is required.
   */
  export type TMetisIcon =
    // ! If adding to list, please maintain
    // ! alphabetical order.
    | '_blank'
    | 'add'
    | 'ban'
    | 'blockquote'
    | 'bold'
    | 'cancel'
    | 'clear-format'
    | 'close'
    | 'code'
    | 'copy'
    | 'code-block'
    | 'device'
    | 'divider'
    | 'down'
    | 'download'
    | 'edit'
    | 'italic'
    | 'kick'
    | 'launch'
    | 'left'
    | 'lightning'
    | 'link'
    | 'lock'
    | 'open'
    | 'options'
    | 'ordered-list'
    | 'overflow'
    | 'play'
    | 'question'
    | 'redo'
    | 'remove'
    | 'reorder'
    | 'right'
    | 'save'
    | 'search'
    | 'shell'
    | 'strike'
    | 'text-cursor'
    | 'underline'
    | 'undo'
    | 'unordered-list'
    | 'up'
    | 'upload'
    | 'user'
    | 'warning-transparent'
    | 'zoom-in'
    | 'zoom-out'

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
