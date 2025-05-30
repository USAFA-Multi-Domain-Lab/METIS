import { createRef, ReactNode, useEffect, useState } from 'react'
import ButtonSvg from 'src/components/content/user-controls/buttons/ButtonSvg'
import If from 'src/components/content/util/If'
import { compute } from 'src/toolbox'
import { MetisComponent } from '../../../../../../../shared'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import Tooltip from '../../../communication/Tooltip'
import { useListContext } from '../List'
import './ListProcessor.scss'

/**
 * Processes the items available in a list by applying
 * any filtering and sorting inputs made by the user.
 */
export default function ListProcessor(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { name, items } = listContext
  const { getCellText } = listContext
  const [_, setProcessedItems] = listContext.state.processedItems
  const [sorting] = listContext.state.sorting
  const [searchActive, activateSearch] = listContext.state.searchActive
  const [searchHint, setSearchHint] = useState<string>('')
  const [hideSearchTooltip, showSearchTooltip] = useState<boolean>(false)
  const searchField = createRef<HTMLInputElement>()
  const { column: sortingColumn, method: sortingMethod } = sorting

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
        // If it doesn't match the condition, return false.
        if (!item.name.toLowerCase().includes(filterTerm)) return false

        // Set search hint if the item name starts with
        // the search team and a hint is not already
        // found.
        if (
          !searchHintFound &&
          item.name.toLowerCase().startsWith(filterTerm) &&
          item.name.length > filterTerm.length
        ) {
          setSearchHint(
            filterTermRaw + item.name.substring(filterTermRaw.length),
          )
          searchHintFound = true
        }

        // Return true since the condition was met.
        return true
      })
    }

    // Apply the sorting state to the result using
    // a Schwartzian transform, starting by creating
    // a temporary sorting array.
    const sortingArray =
      sortingColumn === 'name'
        ? result.map((item) => ({
            item,
            sortKey: item.name,
          }))
        : result.map((item) => ({
            item,
            sortKey: getCellText(item, sortingColumn),
          }))

    // Sort the sorting array based on the sorting
    // method.
    switch (sortingMethod) {
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

    // If no search hint was found, clear the hint.
    if (!searchHintFound) setSearchHint('')

    // Update the processed items.
    setProcessedItems(result)
  }

  /**
   * Clears the search field and deactivates the search.
   * @param event The click event.
   */
  const cancelSearch = () => {
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
    // Deactivate the search if the field is empty.
    if (event.target.value === '') activateSearch(false)
  }

  /* -- EFFECTS -- */

  // This will re-process the list when the items
  // change or if the sorting state changes.
  useEffect(() => {
    process()
  }, [items, items.length, sorting])

  // Focus the search field when the search is
  // activated.
  useEffect(() => {
    let searchFieldElm = searchField.current
    if (searchActive && searchFieldElm) searchFieldElm.focus()
  }, [searchActive])

  /* -- RENDER -- */

  const tooltipJsx = compute<ReactNode>(() => {
    // Return null if the search tooltip
    // is currently hidden.
    if (hideSearchTooltip) return null

    // Render the search tooltip.
    return <Tooltip description={'Search list.'} />
  })

  return (
    <>
      <div className={rootClasses.value}>
        <If condition={!searchActive}>
          <ButtonSvg type={'search'} onClick={() => activateSearch(true)} />
        </If>
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
            <ButtonSvg type={'close'} onClick={cancelSearch} />
            {tooltipJsx}
          </div>
        </If>
      </div>
    </>
  )
}
