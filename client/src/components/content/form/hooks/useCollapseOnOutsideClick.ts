import { useEffect } from 'react'

/**
 * Collapses an expandable detail component when the user clicks outside
 * of its root element. Attach the returned ref to the component's root div.
 * @param expanded Whether the component is currently expanded.
 * @param setExpanded Setter for the expanded state.
 * @param rootRef Reference to the root element of the component using this hook.
 */
export function useCollapseOnOutsideClick(
  expanded: boolean,
  setExpanded: TReactSetter<boolean>,
  rootRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!expanded) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [expanded])
}
