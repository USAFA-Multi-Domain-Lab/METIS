import { createRef, ReactNode, useEffect, useState } from 'react'
import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import './ListFiltering.scss'
import { TListItem } from './ListItem'

/**
 * Provides filtering options for the `List` component,
 * currently only a search bar.
 */
export default function ListFiltering<TItem extends TListItem>({
  items,
  filteredItemsState,
}: TListFiltering_P<TItem>): JSX.Element | null {
  /* -- STATE -- */

  const [filteredItems, setFilteredItems] = filteredItemsState
  const [searchHint, setSearchHint] = useState<string>('')
  const [hideSearchTooltip, showSearchTooltip] = useState<boolean>(false)
  const searchField = createRef<HTMLInputElement>()

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
   * Filters the list of items based on the search term
   * in the search field.
   */
  const filter = () => {
    let searchFieldElm = searchField.current!
    let filterTermRaw = searchFieldElm.value
    let filterTerm = filterTermRaw.trim().toLowerCase()
    let searchHintFound = false

    // If the search term is empty, show all items.
    if (!filterTerm) {
      setFilteredItems(items)
    }
    // Else, filter the items based on the search term.
    else {
      setFilteredItems(
        items.filter((item) => {
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
        }),
      )
    }

    // If no search hint was found, clear the hint.
    if (!searchHintFound) setSearchHint('')
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
      filter()
    }
  }

  /* -- EFFECTS -- */

  // This will re-filter the list when the items
  // change.
  useEffect(() => filter(), [items, items.length])

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
    <div className='ListFiltering'>
      <div className='SearchBox'>
        <div className='SearchIcon'></div>
        <input
          type='text'
          className='SearchField'
          spellCheck={false}
          placeholder={''}
          onChange={filter}
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

/* -- TYPES -- */

/**
 * Props for `ListFiltering`.
 */
export type TListFiltering_P<TItem extends TListItem> = {
  /**
   * The original unfiltered list of items.
   */
  items: TItem[]
  /**
   * The state for the filtered items.
   */
  filteredItemsState: TReactState<TItem[]>
}
