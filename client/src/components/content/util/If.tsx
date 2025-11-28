/**
 * Only renders the children if the condition is true.
 */
export default function ({ children, condition }: TIf_P): TReactElement | null {
  if (Boolean(condition)) return <>{children}</>
  return null
}

/**
 * Props for the `If` component.
 */
export type TIf_P = {
  /**
   * The condition to check.
   */
  condition: any
  /**
   * The children to render if the condition is true.
   */
  children?: React.ReactNode
}
