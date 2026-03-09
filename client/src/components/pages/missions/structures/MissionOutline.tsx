import { useGlobalContext } from '@client/context/global'
import { LocalContext, LocalContextProvider } from '@client/context/local'
import { useDefaultProps } from '@client/toolbox/hooks'
import { useEffect, useState } from 'react'
import './MissionOutline.scss'
import MissionOutlineItem from './MissionOutlineItem'
import MissionOutlineSelectionCount from './MissionOutlineSelectionCount'

/* -- CONTEXT -- */

/**
 * Context for {@link MissionOutline}, distributing props, computed values,
 * state, and element refs to its subcomponents.
 */
const missionOutlineContext = new LocalContext<
  TMissionOutline_P,
  TMissionOutline_C,
  TMissionOutline_S,
  TMissionOutline_E
>()

/**
 * Hook used by {@link MissionOutline} subcomponents to access
 * the MissionOutline context.
 */
export const useMissionOutlineContext = missionOutlineContext.getHook()

/**
 * Renders a read-only, collapsible outline tree driven entirely
 * by the {@link TMissionOutlineItem} interface.
 */
export default function MissionOutline(
  props: TMissionOutline_P,
): TReactElement | null {
  const defaultedProps = useDefaultProps(props, {
    filter: () => true,
    isSelectable: () => false,
    isIndirectlySelectable: () => true,
    onSelectionChange: () => {},
  })
  const { isSelectable: originalIsSelectable } = defaultedProps

  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { forceUpdate } = globalContext.actions
  const state: TMissionOutline_S = {
    selectedItems: useState<Set<TMissionOutlineItem>>(new Set()),
  }
  const [selectedItems, setSelectedItems] = state.selectedItems

  /* -- FUNCTIONS -- */

  /**
   * Toggles the expansion of an item in the outline and triggers a re-render
   * to sync the class state with the component.
   * @param item The item to toggle.
   */
  const toggleItem = (item: TMissionOutlineItem): void => {
    item.expandedInOutline = !item.expandedInOutline
    forceUpdate()
  }

  /**
   * Toggles the selection of an item. If the item is already selected it will
   * be deselected; otherwise it will be added to the selection. Calls
   * `onSelectionChange` with the updated selection after each change.
   * @param item The item to toggle selection for.
   */
  const toggleSelection = (item: TMissionOutlineItem): void => {
    let currentItems = selectedItems
    let updatedItems = new Set(currentItems)

    if (updatedItems.has(item)) {
      updatedItems.delete(item)
    } else {
      updatedItems.add(item)
    }

    setSelectedItems(updatedItems)
    defaultedProps.onSelectionChange([...updatedItems])
  }

  /**
   * Determines whether an item is directly selectable. Returns `false` if any
   * ancestor in the outline tree is currently selected — the item is
   * considered part of that ancestor's indirect group and cannot be selected
   * independently. Delegates to `isSelectable` from props when no selected
   * ancestor is found.
   * @param item The item to evaluate.
   * @returns Whether the item is directly selectable.
   */
  defaultedProps.isSelectable = (item: TMissionOutlineItem): boolean => {
    let parent = item.outlineParent
    while (parent !== null) {
      if (selectedItems.has(parent)) return false
      parent = parent.outlineParent
    }
    return originalIsSelectable(item)
  }

  /* -- EFFECTS -- */

  // When the selection changes, remove any items whose ancestors have since
  // become selected — keeping a descendant alongside a selected ancestor
  // would be redundant and inconsistent with the indirect-group model.
  useEffect(() => {
    let updatedItems = new Set(selectedItems)
    let changed = false

    for (let item of selectedItems) {
      let parent = item.outlineParent
      while (parent !== null) {
        if (updatedItems.has(parent)) {
          updatedItems.delete(item)
          changed = true
          break
        }
        parent = parent.outlineParent
      }
    }

    if (changed) {
      setSelectedItems(updatedItems)
      defaultedProps.onSelectionChange([...updatedItems])
    }
  }, [selectedItems])

  /* -- COMPUTED -- */

  const computed: TMissionOutline_C = {
    toggleItem,
    toggleSelection,
  }
  const elements: TMissionOutline_E = {}

  /* -- RENDER -- */

  return (
    <LocalContextProvider
      context={missionOutlineContext}
      defaultedProps={defaultedProps}
      computed={computed}
      state={state}
      elements={elements}
    >
      <div className='MissionOutline SidePanel'>
        <div className='BorderBox'>
          <div className='OutlineTree'>
            <MissionOutlineItem item={defaultedProps.root} />
          </div>
          <MissionOutlineSelectionCount />
        </div>
      </div>
    </LocalContextProvider>
  )
}

/* -- TYPES -- */

/**
 * Props for the {@link MissionOutline} component.
 */
export interface TMissionOutline_P {
  /**
   * The root item from which to render the outline tree.
   */
  root: TMissionOutlineItem
  /**
   * An optional predicate called for each child item before it is rendered.
   * Return `false` to exclude an item (and its entire subtree) from the outline.
   * By default, all items are included.
   * @default () => true
   */
  filter?: (item: TMissionOutlineItem) => boolean
  /**
   * An optional predicate that determines which items are directly selectable.
   * Non-selectable items with children are purely structural — used for
   * drilling down to potential selections. By default, no items are
   * selectable.
   * @param item The item to evaluate.
   * @default () => false
   */
  isSelectable?: (item: TMissionOutlineItem) => boolean
  /**
   * An optional predicate that determines which children of a selected item
   * are indirectly selected, shown as a visual group within the outline.
   * @param item The child item to evaluate.
   * @param parent The item which is a direct parent of the child being evaluated.
   * @default () => true
   */
  isIndirectlySelectable?: (
    item: TMissionOutlineItem,
    parent: TMissionOutlineItem,
  ) => boolean
  /**
   * Called after each selection change with the full array of currently
   * selected items.
   * @default () => {}
   */
  onSelectionChange?: (selected: TMissionOutlineItem[]) => void
}

/**
 * Computed values derived from props and state for {@link MissionOutline}.
 */
export type TMissionOutline_C = {
  /**
   * Toggles the expansion of an item in the outline and triggers a re-render.
   * @param item The item to toggle.
   */
  toggleItem: (item: TMissionOutlineItem) => void
  /**
   * Toggles the selection of the given item, then calls `onSelectionChange`
   * with the updated selection.
   * @param item The item to toggle selection for.
   */
  toggleSelection: (item: TMissionOutlineItem) => void
}

/**
 * Consolidated state for {@link MissionOutline}.
 */
export type TMissionOutline_S = {
  /**
   * The set of currently selected items.
   */
  selectedItems: TReactState<Set<TMissionOutlineItem>>
}

/**
 * Element refs shared across the {@link MissionOutline} tree.
 */
export type TMissionOutline_E = {}

/**
 * Describes an object that can be displayed as an item within
 * the {@link MissionOutline} component.
 * @note Implement this interface in classes that should be compatible
 * with {@link MissionOutline}.
 */
export interface TMissionOutlineItem {
  /**
   * A unique identifier for this item.
   */
  _id: string
  /**
   * The display name for this item to be used in {@link MissionOutline}.
   */
  name: string
  /**
   * The icon representing this item in the mission outline.
   */
  readonly outlineIcon: TMetisIcon
  /**
   * Whether this item is currently expanded in the mission outline,
   * revealing its `outlineChildren`.
   */
  expandedInOutline: boolean
  /**
   * The children of this item in the mission outline tree.
   */
  get outlineChildren(): TMissionOutlineItem[]
  /**
   * The parent of this item in the mission outline tree, or `null` if this
   * item is the root or is not directly visible in the outline.
   */
  get outlineParent(): TMissionOutlineItem | null
}
