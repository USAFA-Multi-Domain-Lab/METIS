import { useListContext } from './List'

/**
 * Validates props passed to the list.
 */
export default function (): null {
  const { listButtons, itemButtons } = useListContext()

  let buttonCount = listButtons.length + itemButtons.length
  let uniqueButtonCount = new Set([...listButtons, ...itemButtons]).size

  // Throw an error if there are duplicate buttons
  // in the list.
  if (buttonCount !== uniqueButtonCount) {
    throw new Error(
      'Duplicate buttons were passed to the list. All buttons between `listButtons` and `itemButtons` must be unique.',
    )
  }

  return null
}
