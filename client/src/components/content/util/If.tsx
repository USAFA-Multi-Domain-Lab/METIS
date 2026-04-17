/**
 * Only renders the children if the condition is true.
 * @deprecated This component has been deemed problematic
 * because the rendering of the children isn't prevented
 * when the condition is false. They are simply just not
 * rendered to the DOM, which can cause issues if the
 * children have side effects or are expensive to render.
 * @note Use this pattern instead:
 * ```tsx
 * {condition && <>{children}</>}
 * ```
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
