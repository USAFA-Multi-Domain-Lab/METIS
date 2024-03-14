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
