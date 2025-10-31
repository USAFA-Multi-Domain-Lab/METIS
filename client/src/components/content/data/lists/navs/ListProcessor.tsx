import { createRef, ReactNode, useEffect, useState } from 'react'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import If from 'src/components/content/util/If'
import { compute } from 'src/toolbox'
import { useEventListener } from 'src/toolbox/hooks'
import { MetisComponent } from '../../../../../../../shared'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import Tooltip from '../../../communication/Tooltip'
import { useListContext } from '../List'
import './ListProcessor.scss'

/**
 * Processes the items available in a list by applying
 * any filtering and sorting inputs made by the user.
 */
export default function ListProcessor(): TReactElement | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { items, columns, elements, searchBlacklist, getCellText } = listContext
  const [, setProcessedItems] = listContext.state.processedItems
  const [sorting] = listContext.state.sorting
  const [searchActive, activateSearch] = listContext.state.searchActive
  const [itemOrderUpdateId] = listContext.state.itemOrderUpdateId
  const [searchHint, setSearchHint] = useState<string>('')
  const [hideSearchTooltip, showSearchTooltip] = useState<boolean>(false)
  const searchField = createRef<HTMLInputElement>()
  const searchButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'search',
        type: 'button',
        icon: 'search',
        onClick: () => activateSearch(true),
      },
    ],
  })
  const cancelButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'close',
        type: 'button',
        icon: 'close',
        onClick: () => onClose(),
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * The classes for the root element.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('ListProcessor')
    result.set('SearchActive', searchActive)
    return result
  })

  /**
   * The search hint formatted for display.
   */
  const searchHintFormatted = compute<string>(() => {
    // If there is no search hint, return an empty string.
    if (!searchHint) return ''

    // Else return the search hint with '[tab]'
    // appended.
    return searchHint + ' [TAB]'
  })

  /* -- FUNCTIONS -- */

  /**
   * Process the list of items based on the search term
   * in the search field and the current sorting state.
   */
  const process = () => {
    let result: MetisComponent[] = []
    let searchFieldElm = searchField.current
    let filterTermRaw: string = ''
    let filterTerm: string = ''
    let searchHintFound = false
    let searchableColumns: (keyof MetisComponent)[] = ['name', ...columns]

    searchableColumns = searchableColumns.filter((column) => {
      return !searchBlacklist.includes(column)
    })

    // If there is a search field element, get the
    // current search term from it, otherwise default
    // to an empty string.
    if (searchFieldElm) {
      filterTermRaw = searchFieldElm.value
      filterTerm = filterTermRaw.trim().toLowerCase()
    }

    // If the search term is empty, show all items.
    if (!filterTerm) {
      result = [...items]
    }
    // Else, filter the items based on the search term.
    else {
      result = items.filter((item) => {
        let matchFound: string | null = null

        // Check each searchable column for a match,
        // break early if found.
        for (let i = 0; i < searchableColumns.length && !matchFound; i++) {
          let column = searchableColumns[i]
          let cellText =
            column === 'name' ? item.name : getCellText(item, column)

          // Normalize the cell text for comparison.
          cellText = cellText.toLowerCase()

          // Get the cell text for the column
          // and check if it includes the filter
          // term.
          if (cellText.includes(filterTerm)) {
            matchFound = cellText
          }
        }

        // Set search hint if the item name starts with
        // the search team and a hint is not already
        // found.
        if (
          matchFound !== null &&
          !searchHintFound &&
          matchFound.startsWith(filterTerm) &&
          matchFound.length > filterTerm.length
        ) {
          setSearchHint(
            filterTermRaw + matchFound.substring(filterTermRaw.length),
          )
          searchHintFound = true
        }

        // Return whether a match was found.
        return matchFound !== null
      })
    }

    // If there is automatic sorting enabled,
    // apply it to the result.
    if (sorting.method === 'column-based') {
      // Apply the sorting state to the result using
      // a Schwartzian transform, starting by creating
      // a temporary sorting array.
      const sortingArray =
        sorting.column === 'name'
          ? result.map((item) => ({
              item,
              sortKey: item.name,
            }))
          : result.map((item) => ({
              item,
              sortKey: getCellText(item, sorting.column),
            }))

      // Sort the sorting array based on the sorting
      // method.
      switch (sorting.direction) {
        case 'ascending': {
          sortingArray.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
          break
        }
        case 'descending': {
          sortingArray.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
          break
        }
      }

      // Convert the sorting array back and store it
      // in the result.
      result = sortingArray.map((entry) => entry.item)
    }

    // If no search hint was found, clear the hint.
    if (!searchHintFound) setSearchHint('')

    // Update the processed items.
    setProcessedItems(result)
  }

  /**
   * Handles the key down event for the search field.
   */
  const onSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    let key: string = event.key
    let target: HTMLInputElement = event.target as HTMLInputElement

    // If the 'tab' key was pressed, prevent
    // default behavior.
    if (key.toLowerCase() === 'tab') event.preventDefault()

    // If there is a search hint and the tab
    // key was pressed, apply the search hint.
    if (searchHint && key.toLowerCase() === 'tab') {
      target.value = searchHint
      process()
    }
  }

  /**
   * Callback for when the search field is focused.
   * @param event The focus/blur event.
   */
  const onSearchFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    showSearchTooltip(true)
  }

  /**
   * Callback for when the search field is blurred.
   * @param event The focus/blur event.
   */
  const onSearchBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    showSearchTooltip(false)
  }

  /**
   * Closes the search box and clears the search field.
   */
  const onClose = () => {
    let searchFieldElm = searchField.current
    if (!searchFieldElm) return
    // Clear the search field and deactivate the search.
    searchFieldElm.value = ''
    searchFieldElm.blur()
    activateSearch(false)
    setSearchHint('')

    // Process the list to show all items.
    process()
  }

  /* -- EFFECTS -- */

  // This will re-process the list when the items
  // change or if the sorting state changes.
  useEffect(() => {
    process()
  }, [items, items.length, sorting, itemOrderUpdateId])

  // Focus the search field when the search is
  // activated.
  useEffect(() => {
    let searchFieldElm = searchField.current
    if (searchActive && searchFieldElm) searchFieldElm.focus()

    searchButtonEngine.modifyClassList('search', (classList) =>
      classList.set('Hidden', searchActive),
    )
  }, [searchActive])

  // Close the search box when the user clicks outside of the list nav
  // or the button context menu.
  useEventListener(
    document,
    'mousedown',
    (event: MouseEvent) => {
      const selectors = ['.ButtonMenu']
      const blacklistedClasses = ['InputBlocker']
      const navElement = elements.nav.current
      const target = event.target as HTMLElement
      if (!navElement || !target) return

      // Get all elements that prevent closing the search box.
      const ignoredElms: HTMLElement[] = []
      selectors.forEach((selector) => {
        const elements = document.querySelectorAll<HTMLElement>(selector)
        if (elements.length > 0) ignoredElms.push(...elements)
      })
      // Check if any of the blacklisted elements contain the element that
      // was clicked.
      const targetInIgnoredElms = ignoredElms.some(
        (elm) => elm.contains(target) || elm === target,
      )
      // Check if the element that was clicked contains a class that's
      // been blacklisted.
      const targetHasBlacklistedClass = blacklistedClasses.some((cls) =>
        target.classList.contains(cls),
      )
      // If the target is in the ignored elements, do not close the search box.
      if (targetInIgnoredElms || targetHasBlacklistedClass) return

      // If the clicked element is not part of the nav
      // and the search input is empty, close the search box.
      if (!navElement.contains(target) && searchField.current?.value === '') {
        activateSearch(false)
      }
    },
    [elements.nav, searchField],
  )

  /* -- RENDER -- */

  const tooltipJsx = compute<ReactNode>(() => {
    // Return null if the search tooltip
    // is currently hidden.
    if (hideSearchTooltip) return null

    // Render the search tooltip.
    return <Tooltip description={'Search list.'} />
  })

  return (
    <div className={rootClasses.value}>
      <ButtonSvgPanel engine={searchButtonEngine} />
      <If condition={searchActive}>
        <div className='SearchBox'>
          <div className='SearchIcon'></div>
          <input
            type='text'
            className='SearchField'
            spellCheck={false}
            placeholder={''}
            onChange={process}
            onKeyDown={onSearchKeyDown}
            ref={searchField}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
          />
          <input
            type='text'
            className='SearchHint'
            value={searchHintFormatted}
            readOnly
          />
          <ButtonSvgPanel engine={cancelButtonEngine} />
          {tooltipJsx}
        </div>
      </If>
    </div>
  )
}
