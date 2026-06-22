import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import { useDefaultProps } from '@client/toolbox/hooks'
import { getIconPath } from '@client/toolbox/icons'
import { ClassList } from '@shared/toolbox/html/ClassList'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
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

/* -- COMPONENT -- */

/**
 * Renders a read-only, collapsible outline tree driven entirely
 * by the {@link TMissionOutlineItem} interface.
 */
const MissionOutline = forwardRef<TMissionOutlineHandle, TMissionOutline_P>(
  function MissionOutline(props, ref): TReactElement | null {
    const defaultedProps = useDefaultProps(props, {
      filter: () => true,
      isSelectable: () => false,
      isIndirectlySelectable: () => true,
      onSelectionChange: () => {},
    })

    /* -- STATE -- */

    const state: TMissionOutline_S = {
      searchText: useState<string>(''),
    }
    const [value, setValue] = defaultedProps.selectionState
    const { isSelectable: originalIsSelectable, isIndirectlySelectable } =
      defaultedProps
    const [expansionMap, setExpansionMap] = useState<Map<string, boolean>>(
      new Map(),
    )
    const [searchText, setSearchText] = state.searchText
    const clearEngine = useButtonSvgEngine({
      elements: [
        {
          key: 'clear',
          type: 'button',
          icon: 'close',
          cursor: 'pointer',
          label: 'Clear search',
          hidden: true,
          onClick: () => setSearchText(''),
        },
      ],
    })
    const headerEngine = useButtonSvgEngine({
      elements: [
        {
          key: 'expand-all',
          type: 'button',
          icon: 'expand-list',
          cursor: 'pointer',
          label: 'Expand all',
          onClick: () => expandAll(),
        },
        {
          key: 'collapse-all',
          type: 'button',
          icon: 'collapse-list',
          cursor: 'pointer',
          label: 'Collapse all',
          onClick: () => collapseAll(),
        },
      ],
    })

    /* -- FUNCTIONS -- */

    /**
     * @param item The item to check.
     * @returns whether the given item is expanded, reading from the local
     * expansion map first and falling back to the item's own property.
     */
    const isExpanded = (item: TMissionOutlineItem): boolean => {
      if (searchText) return true
      return expansionMap.has(item._id)
        ? expansionMap.get(item._id)!
        : item.expandedInOutline
    }

    /**
     * Toggles the expansion of an item in the outline and triggers a re-render
     * to sync the class state with the component.
     * @param item The item to toggle.
     */
    const toggleItem = (item: TMissionOutlineItem): void => {
      let expanding = !isExpanded(item)
      setExpansionMap((previous) => new Map(previous).set(item._id, expanding))
    }

    /**
     * Toggles the selection of an item. If the item is already selected it will
     * be deselected; otherwise it will be added to the selection. Calls
     * `onSelectionChange` with the updated selection after each change.
     * @param item The item to toggle selection for.
     */
    const toggleSelection = (item: TMissionOutlineItem): void => {
      let currentItems = value
      let updatedItems = new Set(currentItems)

      if (updatedItems.has(item)) {
        updatedItems.delete(item)
      } else {
        updatedItems.add(item)
      }

      setValue([...updatedItems])
    }

    /**
     * Returns the number of selected descendants hidden inside a collapsed item.
     * @param item The item to check.
     */
    const getDescendantSelectionCount = (item: TMissionOutlineItem): number => {
      return badgeCounts.get(item) ?? 0
    }

    /**
     * Performs a deep toggle on the given item and all its descendants —
     * expanding everything if the item is collapsed, collapsing everything
     * if the item is expanded.
     * @param item The item to deep-toggle.
     */
    const toggleAllDescendants = (item: TMissionOutlineItem): void => {
      let expanding = !isExpanded(item)
      let newMap = new Map(expansionMap)
      let stack = [item]
      while (stack.length > 0) {
        let current = stack.pop()!
        newMap.set(current._id, expanding)
        for (let child of current.outlineChildren) {
          stack.push(child)
        }
      }
      setExpansionMap(newMap)
    }

    /**
     * Expands every item in the outline tree.
     */
    const expandAll = (): void => {
      let newMap = new Map(expansionMap)
      let stack: TMissionOutlineItem[] = [defaultedProps.root]
      while (stack.length > 0) {
        let current = stack.pop()!
        newMap.set(current._id, true)
        for (let child of current.outlineChildren) {
          stack.push(child)
        }
      }
      setExpansionMap(newMap)
    }

    /**
     * Collapses every item in the outline tree.
     */
    const collapseAll = (): void => {
      let newMap = new Map(expansionMap)
      let stack: TMissionOutlineItem[] = [defaultedProps.root]
      while (stack.length > 0) {
        let current = stack.pop()!
        newMap.set(current._id, false)
        for (let child of current.outlineChildren) {
          stack.push(child)
        }
      }
      setExpansionMap(newMap)
    }

    /**
     * Expands all ancestors of the given item, making it visible in the outline.
     * @param item The item whose ancestors should be expanded.
     */
    const revealItem = (item: TMissionOutlineItem): void => {
      let newMap = new Map(expansionMap)
      let current = item.outlineParent
      while (current !== null) {
        newMap.set(current._id, true)
        current = current.outlineParent
      }
      setExpansionMap(newMap)
    }

    /**
     * Expands all ancestors of each selected item that lives inside the given
     * collapsed item, making every hidden selection visible in the outline.
     * @param item The collapsed item whose hidden selections should be revealed.
     */
    const revealSelectedDescendants = (item: TMissionOutlineItem): void => {
      let newMap = new Map(expansionMap)
      for (let selected of value) {
        let current: TMissionOutlineItem | null = selected.outlineParent
        let path: TMissionOutlineItem[] = []
        while (current !== null) {
          path.push(current)
          if (current === item) {
            for (let ancestor of path) {
              newMap.set(ancestor._id, true)
            }
            break
          }
          current = current.outlineParent
        }
      }
      setExpansionMap(newMap)
    }

    /**
     * Determines whether an item is directly selectable. Returns `false` if any
     * ancestor in the outline tree is currently selected AND the item is
     * indirectly selectable under that ancestor — meaning it is part of that
     * ancestor's indirect group and cannot be selected independently. Items
     * that are not indirectly selectable under a selected ancestor remain
     * directly selectable. Delegates to `isSelectable` from props when no
     * blocking ancestor is found.
     * @param item The item to evaluate.
     * @returns Whether the item is directly selectable.
     */
    defaultedProps.isSelectable = (item: TMissionOutlineItem): boolean => {
      let child = item
      let parent = item.outlineParent
      while (parent !== null) {
        if (value.includes(parent) && isIndirectlySelectable(child, parent)) {
          return false
        }
        child = parent
        parent = parent.outlineParent
      }
      return originalIsSelectable(item)
    }

    /* -- COMPUTED -- */

    // Perform filter logic.
    let originalFilter = defaultedProps.filter
    let matchingIds = useMemo((): Set<string> | null => {
      if (!searchText) return null
      let query = searchText.toLowerCase()
      let result = new Set<string>()
      const visit = (item: TMissionOutlineItem): boolean => {
        let nameMatches = item.name.toLowerCase().includes(query)
        let visibleChildren = item.outlineChildren.filter(originalFilter)
        let anyChildMatches = visibleChildren
          .map((child) => visit(child))
          .includes(true)
        if (nameMatches || anyChildMatches) result.add(item._id)
        return nameMatches || anyChildMatches
      }
      visit(defaultedProps.root)
      return result
    }, [searchText])
    defaultedProps.filter = (item: TMissionOutlineItem): boolean => {
      if (!originalFilter(item)) return false
      if (matchingIds === null) return true
      return matchingIds.has(item._id)
    }
    let hasResults = matchingIds === null || matchingIds.size > 0

    let allCollapsed = useMemo(() => {
      let stack = [defaultedProps.root]
      while (stack.length > 0) {
        let current = stack.pop()!
        let children = current.outlineChildren.filter(defaultedProps.filter)
        if (children.length > 0) {
          if (isExpanded(current)) return false
          for (let child of children) stack.push(child)
        }
      }
      return true
    }, [expansionMap])

    // Determine where to render badges showing counts
    // in the outline tree.
    let badgeCounts = useMemo(() => {
      let map = new Map<TMissionOutlineItem, number>()
      for (let item of value) {
        let current = item.outlineParent
        while (current !== null) {
          let parent = current.outlineParent
          if (!isExpanded(current)) {
            if (parent === null || isExpanded(parent)) {
              map.set(current, (map.get(current) ?? 0) + 1)
              break
            }
          }
          current = parent
        }
      }
      return map
    }, [value, expansionMap])

    let outlineTreeClasses = new ClassList('OutlineTree').set(
      'IsFiltered',
      searchText,
    )

    /* -- EFFECTS -- */

    // When the selection changes, remove any items that are indirectly
    // selectable under a now-selected ancestor — keeping a descendant that is
    // NOT indirectly selectable alongside a selected ancestor is valid, since
    // those items are independently selectable by design.
    useEffect(() => {
      let newValue = [...value]
      let changed = false

      for (let item of value) {
        let child = item
        let parent = item.outlineParent
        while (parent !== null) {
          if (
            newValue.includes(parent) &&
            isIndirectlySelectable(child, parent)
          ) {
            newValue = newValue.filter((i) => i !== item)
            changed = true
            break
          }
          child = parent
          parent = parent.outlineParent
        }
      }

      if (changed) {
        setValue(newValue)
      }
    }, [value])

    // Adjust button visibility for the header button
    // based on whether all items are currently collapsed.
    useEffect(() => {
      headerEngine.setHidden('expand-all', !allCollapsed)
      headerEngine.setHidden('collapse-all', allCollapsed)
    }, [allCollapsed])

    // Hide clear button for search text when
    // there is no search text. Also, disable
    // expand/collapse all buttons when there is
    // search text, since expansion is forced in
    // that case.
    useEffect(() => {
      clearEngine.setHidden('clear', !searchText)
      headerEngine.setDisabled('expand-all', Boolean(searchText))
      headerEngine.setDisabled('collapse-all', Boolean(searchText))
    }, [searchText])

    useImperativeHandle(ref, () => ({ revealItem }))

    /* -- CONTEXT COMPILATION -- */

    const computed: TMissionOutline_C = {
      isExpanded,
      toggleItem,
      toggleSelection,
      toggleAllDescendants,
      getDescendantSelectionCount,
      revealSelectedDescendants,
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
            <div className='OutlineHeader'>
              <div className='SearchBox'>
                <input
                  type='text'
                  className='OutlineSearch'
                  placeholder='Filter components'
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
                {searchText && <ButtonSvgPanel engine={clearEngine} />}
              </div>
              <ButtonSvgPanel engine={headerEngine} />
            </div>
            <div className={outlineTreeClasses.value}>
              {hasResults ? (
                <MissionOutlineItem item={defaultedProps.root} />
              ) : (
                <div className='NoResults'>No results.</div>
              )}
            </div>
            <MissionOutlineSelectionCount />
          </div>
        </div>
      </LocalContextProvider>
    )
  },
)

export default MissionOutline

/* -- UTILITY FUNCTIONS -- */

/**
 * @param item Any outline item.
 * @returns The CSS styling needed to render this item's
 * icon in an HTML element.
 * @note This only applies a background image, other
 * styling will be necessary to render it the way you
 * would like.
 */
export function computeOutlineIconStyling(
  item: TMissionOutlineItem,
): React.CSSProperties {
  return {
    backgroundImage: compute<string>(() => {
      let url = getIconPath(item.outlineIcon)
      return url ? `url(${url})` : 'none'
    }),
  }
}

/* -- TYPES -- */

/**
 * Imperative handle exposed by {@link MissionOutline} via `forwardRef`.
 */
export interface TMissionOutlineHandle {
  /**
   * Expands all ancestors of the given item so it becomes visible in the outline.
   * @param item The item to reveal.
   */
  revealItem: (item: TMissionOutlineItem) => void
}

/**
 * Props for the {@link MissionOutline} component.
 */
export interface TMissionOutline_P {
  /**
   * The root item from which to render the outline tree.
   */
  root: TMissionOutlineItem
  /**
   * A React state tuple containing a value, which is the current
   * selection state of items in the outline, and a setter function
   * to update the value statefully.
   */
  selectionState: TReactState<TMissionOutlineItem[]>
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
}

/**
 * Computed values derived from props and state for {@link MissionOutline}.
 */
export type TMissionOutline_C = {
  /**
   * Returns whether the given item is currently expanded in the outline.
   * @param item The item to check.
   */
  isExpanded: (item: TMissionOutlineItem) => boolean
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
  /**
   * Performs a deep toggle on the given item and all its descendants —
   * expanding everything if the item is collapsed, collapsing everything
   * if the item is expanded.
   * @param item The item to deep-toggle.
   */
  toggleAllDescendants: (item: TMissionOutlineItem) => void
  /**
   * Returns the number of selected descendants hidden inside a collapsed item.
   * @param item The item to check.
   */
  getDescendantSelectionCount: (item: TMissionOutlineItem) => number
  /**
   * Expands all ancestors of each selected item that lives inside the given
   * collapsed item, making every hidden selection visible in the outline.
   * @param item The collapsed item whose hidden selections should be revealed.
   */
  revealSelectedDescendants: (item: TMissionOutlineItem) => void
}

/**
 * Consolidated state for {@link MissionOutline}.
 */
export type TMissionOutline_S = {
  searchText: TReactState<string>
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
