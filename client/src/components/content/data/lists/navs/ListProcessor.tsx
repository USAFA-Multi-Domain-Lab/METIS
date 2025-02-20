import { createRef, ReactNode, useEffect, useState } from 'react'
import { compute } from 'src/toolbox'
import Tooltip from '../../../communication/Tooltip'
import { useListContext } from '../List'
import './ListProcessor.scss'
import { TListItem } from '../pages/ListItem'
import ClientMission from 'src/missions'

/**
 * Processes the items available in a list by applying
 * any filtering and sorting inputs made by the user.
 */
export default function ListProcessor(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { items } = listContext
  const { getCellText } = listContext
  const [_, setProcessedItems] = listContext.state.processedItems
  const [sorting] = listContext.state.sorting
  const [searchHint, setSearchHint] = useState<string>('')
  const [hideSearchTooltip, showSearchTooltip] = useState<boolean>(false)
  const searchField = createRef<HTMLInputElement>()
  const { column: sortingColumn, method: sortingMethod } = sorting

  /* -- COMPUTED -- */

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
    let result: TListItem[] = []
    let searchFieldElm = searchField.current!
    let filterTermRaw = searchFieldElm.value
    let filterTerm = filterTermRaw.trim().toLowerCase()
    let searchHintFound = false

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

  /* -- EFFECTS -- */

  // This will re-process the list when the items
  // change or if the sorting state changes.
  useEffect(() => process(), [items, items.length, sorting])

  /* -- RENDER -- */

  const tooltipJsx = compute<ReactNode>(() => {
    // Return null if the search tooltip
    // is currently hidden.
    if (hideSearchTooltip) return null

    // Render the search tooltip.
    return <Tooltip description={'Search list.'} />
  })

  // Render the list filtering.
  return (
    <div className='ListProcessor'>
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
          onFocus={() => showSearchTooltip(true)}
          onBlur={() => showSearchTooltip(false)}
        />
        <input
          type='text'
          className='SearchHint'
          value={searchHintFormatted}
          readOnly
        />
        {tooltipJsx}
      </div>
    </div>
  )
}
