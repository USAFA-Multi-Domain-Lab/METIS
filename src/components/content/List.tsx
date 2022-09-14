/* -- imports -- */

import './List.scss'
import React from 'react'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import Tooltip from './Tooltip'

/* -- enumerations -- */

export enum ESortByMethod {
  Name,
  MostRecent,
  LeastRecent,
}

/* -- interfaces -- */

interface IList_P<TList> {
  // the items that make up the list
  items: TList[]
  // represents available properties that
  // items might have
  availableProperties: IListItemProperty[]
  // returns what's rendered inside the
  // item's box
  getItemDisplay: (item: TList) => string | JSX.Element
  // items that are selected are marked differently
  // when displayed to the user
  isItemSelected: (item: TList) => boolean
  // returns whether the given item in the list
  // is of the given property
  itemHasProperty: (item: TList, property: IListItemProperty) => boolean
  // // whether the item in the list is a match
  // // for the searched term
  // matches: (item: TList, term: string) => boolean
  // the properties of TList that can be searched
  // by in the list's search bar
  searchableProperties: string[]
  // These are the methods that the list can be
  // sorted by.
  sortByMethods: ESortByMethod[]
  // This is the property in the items
  // of the list that represents the name
  // or title of that item. This is used
  // to sort list by name.
  nameProperty: string | null
  // This is the default filter
  // term put into the search
  // bar.
  defaultFilterTerm: string
  // This is the default sort by
  // method for sorting the items
  // in the list.
  defaultSortByMethod: ESortByMethod
  // This is the property in the items
  // of the list that represents the time
  // that this resource was created. This
  // is used to sort list by date.
  timeCreatedProperty: string | null
  // what's rendered when there are no items
  // in the list
  noItemsDisplay: string | JSX.Element | null
  // handles when the user clicks an item
  handleSelection: ((item: TList) => void) | null
  // handles when the user start a drag on an
  // item
  handleGrab:
    | ((item: TList, event: React.DragEvent<HTMLDivElement>) => void)
    | null
  // handles when the user ends a drag on an
  // item
  handleRelease: ((item: TList) => void) | null
  // renders any extra child elements that may be
  // needed
  renderExtras: (item: TList) => JSX.Element | null
  // what an item shows when it's hovered over
  renderTooltipDescription: (
    item: TList,
    propertyTooltipDescription: string,
  ) => string | null
  // the key for the item element
  renderKey: (item: TList, index: number) => string
  // if the items and the list are retrieved
  // from the back-end, the status for the
  // ajax call is passed here to display
  // "loading..." to the user
  ajaxStatus: EAjaxStatus
  // unique identifier for the list for CSS
  // purposes
  listSpecificItemClassName: string
  // applies the class name returned by
  // by the function for the given item,
  // this is useful for applying distinct
  // class names to only certain items in
  // the list
  applyClassNameAddon: (item: TList) => string
  // adds and ID to the element
  applyElementID: (item: TList) => string | undefined
  // custom styling for the item in question
  applyStyling: (item: TList) => React.CSSProperties
  // what's displayed in the heading
  headingText: string
  // what's displayed below the heading
  // as a subtitle of sorts
  subheadingText: string | null
  // how many items to display before
  // paginating the items
  itemsPerPage: number | null
  // whether two pages should be displayed
  // side-by-side in a wider view, and
  // each time you hit next page two pages
  // are moved up at once.
  duelPageMode: boolean
  // blanks are used when multiple pages
  // are created, they are used as filler
  // items to maintain a consistent height
  // for the list, marking this will always
  // fill the list with these blanks even
  // if nothing is paginated
  alwaysUseBlanks: boolean
  // overrides the custom styling applied to
  // items in the list that display elements
  // instead of string values.
  preventMarkdownStyling: boolean
  // if the list can be edited, this can be
  // marked to render the list as being in edit
  // mode
  pendingEdit: boolean
  // if items in the list can be removed
  // directly, this can be marked to render the
  // list as being in deletion mode
  pendingDeletion: boolean
  // when a list is in edit or deletion mode, a
  // cancel action can be clicked in the list,
  // this can be handled here with the intention
  // of "pendingEdit" and "pendingDeletion" being
  // marked as false
  handleActionCancelation: () => void
}

interface IList_S<TList> {
  page: number
  itemsFiltered: TList[]
  filterTerm: string
  filterHint: string
  hideSearchTooltip: boolean
  selectedSortByMethod: ESortByMethod
  selectedProperty: IListItemProperty | null
  hoveredProperty: IListItemProperty | null
}

// represents a property an item
// might have
export interface IListItemProperty {
  id: string
  emoji: string
  description: string
}

export default class List<TList extends object> extends React.Component<
  IList_P<TList>,
  IList_S<TList>
> {
  // props set when none are passed to
  // the component
  static defaultProps = {
    availableProperties: [],
    sortByMethods: [],
    defaultSortByMethod: ESortByMethod.MostRecent,
    defaultFilterTerm: '',
    nameProperty: null,
    timeCreatedProperty: null,
    isItemSelected: () => false,
    itemHasProperty: () => false,
    handleSelection: null,
    handleGrab: null,
    handleRelease: null,
    renderTooltipDescription: () => null,
    renderKey: (item: any, index: string) => `item-${index}`,
    renderExtras: () => null,
    listSpecificItemClassName: '',
    applyClassNameAddon: () => '',
    applyElementID: () => undefined,
    applyStyling: () => {},
    subheadingText: null,
    itemsPerPage: 5,
    duelPageMode: false,
    alwaysUseBlanks: false,
    preventMarkdownStyling: false,
    pendingEdit: false,
    pendingDeletion: false,
    handleActionCancelation: () => {},
  }

  // This will return the first index
  // displayed for a given page.
  static getFirstItemIndex(page: number, itemsPerPage: number | null): number {
    let firstItemIndex: number = 0
    if (itemsPerPage) {
      firstItemIndex = page * itemsPerPage
    }
    return firstItemIndex
  }

  // This will return the last index
  // displayed for a given page.
  static getCuttoffItemIndex(
    page: number,
    itemsPerPage: number | null,
    itemsLength: number,
  ): number {
    let firstItemIndex: number = this.getFirstItemIndex(page, itemsPerPage)
    let cuttoffItemIndex: number = itemsLength
    if (itemsPerPage) {
      cuttoffItemIndex = firstItemIndex + itemsPerPage
    }
    return cuttoffItemIndex
  }

  // This will return the total number
  // of availalble pages.
  static getTotalPages(
    itemsPerPage: number | null,
    itemsLength: number,
  ): number {
    if (itemsPerPage == null) {
      return 1
    } else {
      return Math.max(Math.ceil(itemsLength / itemsPerPage), 1)
    }
  }

  state: IList_S<TList>

  searchField: React.RefObject<HTMLInputElement>

  constructor(props: IList_P<TList>) {
    super(props)
    this.state = {
      page: 0,
      itemsFiltered: props.items,
      filterTerm: '',
      filterHint: '',
      selectedSortByMethod: props.defaultSortByMethod,
      hideSearchTooltip: false,
      selectedProperty: null,
      hoveredProperty: null,
    }
    this.searchField = React.createRef()
  }

  componentDidMount(): void {
    let searchField: HTMLInputElement | null = this.searchField.current
    let defaultFilterTerm: string = this.props.defaultFilterTerm

    if (searchField !== null) {
      searchField.value = defaultFilterTerm
    }

    this.filter()
  }

  componentDidUpdate(previousProps: IList_P<TList>): void {
    if (previousProps.items !== this.props.items) {
      this.filter()
    }
  }

  // This returns whether the list should
  // render blanks to end a page of items.
  get blanksAreEnabled(): boolean {
    return this.props.alwaysUseBlanks || this.props.duelPageMode
  }

  // goes forward a page in the list,
  // displaying the items on the page
  turnPage = (): void => {
    let items: TList[] = this.props.items
    let currentPage: number = this.state.page
    let itemsPerPage: number | null = this.props.itemsPerPage
    let duelPageMode: boolean = this.props.duelPageMode
    let cuttoffItemIndex: number = List.getCuttoffItemIndex(
      currentPage,
      itemsPerPage,
      items.length,
    )
    let pagesForward: number = 1
    if (duelPageMode && itemsPerPage !== null) {
      cuttoffItemIndex += itemsPerPage
      pagesForward = 2
    }
    let isNextPage: boolean = cuttoffItemIndex < items.length
    if (isNextPage) {
      this.setState({ page: currentPage + pagesForward })
    }
  }

  // goes back a page in the list,
  // displaying the items on the page
  turnBackPage = (): void => {
    let currentPage: number = this.state.page
    let duelPageMode: boolean = this.props.duelPageMode
    let isPreviousPage: boolean = duelPageMode
      ? currentPage > 1
      : currentPage > 0
    let pagesBack: number = duelPageMode ? 2 : 1
    if (isPreviousPage) {
      this.setState({ page: currentPage - pagesBack })
    }
  }

  // gets the inputed value for the search
  // bar and filters the items in the list
  // by that term
  filter = (): void => {
    try {
      let searchField: HTMLInputElement | null = this.searchField.current
      let selectedProperty: IListItemProperty | null =
        this.state.selectedProperty
      let itemsFiltered: TList[] = []
      let filterTerm: string = ''
      let filterHint: string | null = null
      let selectedSortByMethod: ESortByMethod = this.state.selectedSortByMethod
      let nameProperty: string | null = this.props.nameProperty
      let timeCreatedProperty: string | null = this.props.timeCreatedProperty

      if (searchField) {
        filterTerm = searchField.value

        let term = filterTerm.toLowerCase()
        let items: TList[] = this.props.items

        for (let item of items) {
          let matchesTerm: boolean = false
          let toSearch: string = ''
          let itemWasAdded: boolean = false

          for (let key of this.props.searchableProperties) {
            if (key in item && typeof (item as any)[key] === 'string') {
              toSearch = (item as any)[key]
              matchesTerm = toSearch.toLowerCase().includes(term)

              if (matchesTerm) {
                if (!itemWasAdded) {
                  itemsFiltered.push(item)
                }
                itemWasAdded = true

                if (
                  term.length > 0 &&
                  filterHint === null &&
                  toSearch.toLowerCase().startsWith(term)
                ) {
                  filterHint = `${toSearch}`
                  break
                }
              }
            } else if (key in item && Array.isArray((item as any)[key])) {
              for (let subItem of (item as any)[key]) {
                if (typeof subItem === 'string') {
                  toSearch = subItem
                  matchesTerm = toSearch.toLowerCase().includes(term)

                  if (matchesTerm) {
                    if (!itemWasAdded) {
                      itemsFiltered.push(item)
                    }
                    itemWasAdded = true

                    if (
                      term.length > 0 &&
                      filterHint === null &&
                      toSearch.toLowerCase().startsWith(term)
                    ) {
                      filterHint = `${toSearch}`
                      break
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (filterHint === null) {
        filterHint = ''
      }

      switch (selectedSortByMethod) {
        case ESortByMethod.Name:
          if (nameProperty !== null) {
            let property1: string = nameProperty
            itemsFiltered = itemsFiltered.sort((itemA: any, itemB: any) => {
              let caseInsensitiveResult = itemA[property1]
                .toLowerCase()
                .localeCompare(itemB[property1].toLowerCase())
              let caseSensitiveResult = itemA[property1].localeCompare(
                itemB[property1],
              )
              return caseInsensitiveResult === 0
                ? caseSensitiveResult
                : caseInsensitiveResult
            })
          }
          break
        case ESortByMethod.MostRecent:
          if (timeCreatedProperty !== null) {
            let property2: string = timeCreatedProperty
            itemsFiltered = itemsFiltered.sort((itemA: any, itemB: any) => {
              let timestampA: number = itemA[property2].getTime()
              let timestampB: number = itemB[property2].getTime()

              return timestampB - timestampA
            })
          }
          break
        case ESortByMethod.LeastRecent:
          if (timeCreatedProperty !== null) {
            let property3: string = timeCreatedProperty
            itemsFiltered = itemsFiltered.sort((itemA: any, itemB: any) => {
              let timestampA: number = itemA[property3].getTime()
              let timestampB: number = itemB[property3].getTime()

              return timestampA - timestampB
            })
          }
          break
      }

      if (selectedProperty) {
        let withProperty: TList[] = []
        let withoutProperty: TList[] = []
        for (let item of itemsFiltered) {
          if (this.props.itemHasProperty(item, selectedProperty)) {
            withProperty.push(item)
          } else {
            withoutProperty.push(item)
          }
        }
        itemsFiltered = [...withProperty, ...withoutProperty]
      }

      this.setState({ page: 0, itemsFiltered, filterTerm, filterHint })
    } catch (error) {
      console.log('Failed to filter list.')
      console.error(error)
    }
  }

  /* -- handlers -- */

  handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    let key: string = event.key
    let target: HTMLInputElement = event.target as HTMLInputElement
    let filterHint: string = this.state.filterHint

    if (key === 'Tab') {
      target.value = filterHint

      this.filter()

      event.preventDefault()
    }
  }

  /* -- render -- */

  // This will render the filtering/search
  // box at the top of the list.
  renderFiltering(): JSX.Element | null {
    let filterTerm: string = this.state.filterTerm
    let filterHint: string = this.state.filterHint
    let hideSearchTooltip: boolean = this.state.hideSearchTooltip

    if (filterTerm.length > 13) {
      filterHint = ''
    }

    if (filterTerm.length <= filterHint.length) {
      let replaceTarget: string = filterHint.substring(0, filterTerm.length)

      filterHint = filterHint.replace(replaceTarget, filterTerm)
    }

    if (filterHint.length > 0 && filterHint !== filterTerm) {
      filterHint += ' [tab]'
    }

    return (
      <div className='filtering'>
        <div className='search-box'>
          <div className='search-icon'></div>
          <input
            type='text'
            className='search-field'
            spellCheck={false}
            placeholder={''}
            onChange={this.filter}
            onKeyDown={this.handleSearchKeyDown}
            ref={this.searchField}
            onFocus={() => {
              this.setState({ hideSearchTooltip: true })
            }}
            onBlur={() => {
              this.setState({ hideSearchTooltip: false })
            }}
          />
          <div className='search-hint'>{filterHint}</div>
          {hideSearchTooltip ? null : <Tooltip description={'Search list.'} />}
        </div>
        {/* {this.renderSortByMethods()} */}
      </div>
    )
  }
  //
  //   // This will render the sort by methods
  //   // that can be clicked to sort the list
  //   // of items.
  //   renderSortByMethods(): JSX.Element | null {
  //     let selectedSortByMethod: ESortByMethod = this.state.selectedSortByMethod
  //
  //     const availableActions: {
  //       name: IAction_P
  //       mostRecent: IAction_P
  //       leastRecent: IAction_P
  //     } = {
  //       name: {
  //         ...Action.defaultProps,
  //         purpose: EActionPurpose.Alphabetical,
  //         handleClick: () =>
  //           this.setState(
  //             { selectedSortByMethod: ESortByMethod.Name },
  //             this.filter,
  //           ),
  //         tooltipDescription: 'Sort list alphabetically.',
  //         key: 'name',
  //         uniqueClassName:
  //           selectedSortByMethod === ESortByMethod.Name ? ' selected' : '',
  //       },
  //       mostRecent: {
  //         ...Action.defaultProps,
  //         purpose: EActionPurpose.Clock,
  //         handleClick: () =>
  //           this.setState(
  //             { selectedSortByMethod: ESortByMethod.MostRecent },
  //             this.filter,
  //           ),
  //         tooltipDescription: 'Sort list most recent.',
  //         key: 'most-recent',
  //         uniqueClassName:
  //           selectedSortByMethod === ESortByMethod.MostRecent ? ' selected' : '',
  //       },
  //       leastRecent: {
  //         ...Action.defaultProps,
  //         purpose: EActionPurpose.ClockSmall,
  //         handleClick: () =>
  //           this.setState(
  //             { selectedSortByMethod: ESortByMethod.LeastRecent },
  //             this.filter,
  //           ),
  //         tooltipDescription: 'Sort list by least recent.',
  //         key: 'least-recent',
  //         uniqueClassName:
  //           selectedSortByMethod === ESortByMethod.LeastRecent ? ' selected' : '',
  //       },
  //     }
  //
  //     let sortByMethods: ESortByMethod[] = this.props.sortByMethods
  //     let nameProperty: string | null = this.props.nameProperty
  //     let timeCreatedProperty: string | null = this.props.timeCreatedProperty
  //     let sortByMethodElements: Array<JSX.Element | null> = []
  //
  //     for (let sortByMethod of sortByMethods) {
  //       switch (sortByMethod) {
  //         case ESortByMethod.Name:
  //           if (nameProperty !== null) {
  //             sortByMethodElements.push(
  //               new Action(availableActions.name).render(),
  //             )
  //           }
  //           break
  //         case ESortByMethod.MostRecent:
  //           if (timeCreatedProperty !== null) {
  //             sortByMethodElements.push(
  //               new Action(availableActions.mostRecent).render(),
  //             )
  //           }
  //           break
  //         case ESortByMethod.LeastRecent:
  //           if (timeCreatedProperty !== null) {
  //             sortByMethodElements.push(
  //               new Action(availableActions.leastRecent).render(),
  //             )
  //           }
  //           break
  //       }
  //     }
  //
  //     return <div className='sort-by-methods'>{sortByMethodElements}</div>
  //   }

  // renders the tooltip addon that will
  // be displayed for an item containing
  // the following properties
  renderPropertyTooltipDescription(item: TList): string {
    let availableProperties: IListItemProperty[] =
      this.props.availableProperties
    let tooltip: string = ''
    for (let property of availableProperties) {
      if (this.props.itemHasProperty(item, property)) {
        tooltip += `- **${property.emoji}** *${property.id}*\n`
      }
    }
    return tooltip
  }

  // This will render the properties
  // that an item in the list may have.
  renderProperties(item: TList): JSX.Element[] {
    let availableProperties: IListItemProperty[] =
      this.props.availableProperties
    let propertyElements: JSX.Element[] = availableProperties.map(
      (property: IListItemProperty, index: number) => {
        let itemHasProperty: boolean = this.props.itemHasProperty(
          item,
          property,
        )
        let className: string = 'property'
        if (itemHasProperty) {
          className += ' with'
        } else {
          className += ' without'
        }
        return (
          <div
            className={className}
            id={`${index}`}
            key={property.id}
            onClick={() =>
              this.setState({ selectedProperty: property }, this.filter)
            }
          >
            {property.emoji}
          </div>
        )
      },
    )
    return propertyElements
  }

  // renders the items that will be displayed
  // in the list
  renderItems(
    page: number,
    rendersStatusAsItem: boolean = true,
  ): JSX.Element[] {
    let itemElements: JSX.Element[] = []
    let items: TList[] = this.props.items
    let itemsFiltered: TList[] = this.state.itemsFiltered
    let ajaxStatus: EAjaxStatus = this.props.ajaxStatus
    let itemsPerPage: number | null = this.props.itemsPerPage
    let availableProperties: IListItemProperty[] =
      this.props.availableProperties
    let hoveredProperty: IListItemProperty | null = this.state.hoveredProperty
    let listSpecificItemClassName: string | null =
      this.props.listSpecificItemClassName
    let noItemsDisplay: string | JSX.Element | null = this.props.noItemsDisplay
    let blanksAreEnabled: boolean = this.blanksAreEnabled
    let preventMarkdownStyling: boolean = this.props.preventMarkdownStyling
    let firstItemIndex: number = List.getFirstItemIndex(page, itemsPerPage)
    let cuttoffItemIndex: number = List.getCuttoffItemIndex(
      page,
      itemsPerPage,
      itemsFiltered.length,
    )
    if (
      ajaxStatus === EAjaxStatus.NotLoaded ||
      ajaxStatus === EAjaxStatus.Loaded
    ) {
      if (items.length === 0 && noItemsDisplay) {
        if (rendersStatusAsItem) {
          itemElements.push(
            <div
              className={`item no-items ${listSpecificItemClassName}`}
              key={'no-items'}
            >
              {noItemsDisplay}
            </div>,
          )
        }
      } else if (items.length > 0 && itemsFiltered.length === 0) {
        if (rendersStatusAsItem) {
          itemElements.push(
            <div
              className={`item no-items ${listSpecificItemClassName}`}
              key={'no-items'}
            >
              {'no matches'}
            </div>,
          )
        }
      } else {
        itemsFiltered.forEach((item: any, index: number) => {
          if (index >= firstItemIndex && index < cuttoffItemIndex) {
            let propertyElements: JSX.Element[] = this.renderProperties(item)
            let propertyTooltipDescription: string =
              this.renderPropertyTooltipDescription(item)
            let tooltipDescription: string | null =
              this.props.renderTooltipDescription(
                item,
                propertyTooltipDescription,
              )
            let display: string | JSX.Element = this.props.getItemDisplay(item)
            let renderedDisplay: string | JSX.Element = ''
            let selected: boolean = this.props.isItemSelected(item)
            let className = 'item'
            let classNameAddon = this.props.applyClassNameAddon(item)
            if (listSpecificItemClassName) {
              className += ` ${listSpecificItemClassName}`
            }
            if (classNameAddon.length > 0) {
              className += ` ${classNameAddon}`
            }
            if (propertyElements.length > 0) {
              className += ' with-properties'
            }
            if (hoveredProperty) {
              tooltipDescription = `##### ${hoveredProperty.emoji} ${hoveredProperty.id}\n${hoveredProperty.description}\n**Click to sort.**`
            }
            if (typeof display === 'string') {
              renderedDisplay = `${selected ? '✔️ ' : ''}${display}`
            } else {
              renderedDisplay = display
              if (!preventMarkdownStyling) {
                className += ' item-markdown'
              }
            }
            if (this.props.isItemSelected(item)) {
              className += ' selected'
            }
            itemElements.push(
              <div
                className={className}
                id={this.props.applyElementID(item)}
                style={this.props.applyStyling(item)}
                key={this.props.renderKey(item, index)}
                draggable={this.props.handleGrab !== null}
                onClick={() => {
                  if (this.props.handleSelection && !hoveredProperty) {
                    this.props.handleSelection(item)
                  }
                }}
                onDragStart={(event: React.DragEvent<HTMLDivElement>) => {
                  if (this.props.handleGrab && !hoveredProperty) {
                    this.props.handleGrab(item, event)
                  }
                }}
                onDragEnd={(event: React.DragEvent<HTMLDivElement>) => {
                  if (this.props.handleRelease && !hoveredProperty) {
                    this.props.handleRelease(item)
                  }
                }}
                onMouseMove={() => {
                  if (propertyElements.length > 0) {
                    let element: any = document.querySelector(
                      '.List .item .property:hover',
                    )
                    if (element && !element.matches('.without')) {
                      let hoveredProperty: IListItemProperty =
                        availableProperties[parseInt(element.id)]
                      if (this.state.hoveredProperty !== hoveredProperty) {
                        this.setState({ hoveredProperty })
                      }
                    } else {
                      if (this.state.hoveredProperty) {
                        this.setState({ hoveredProperty: null })
                      }
                    }
                  }
                }}
              >
                {renderedDisplay}
                {this.props.renderExtras(item)}
                {propertyElements.length > 0 ? (
                  <div className='properties'>{propertyElements}</div>
                ) : null}
                {tooltipDescription ? (
                  <Tooltip description={tooltipDescription} />
                ) : null}
              </div>,
            )
          }
        })
      }
      if (
        (blanksAreEnabled && itemsPerPage) ||
        (itemsPerPage && items.length > itemsPerPage)
      ) {
        while (itemElements.length < itemsPerPage) {
          itemElements.push(
            <div
              className='item item-blank'
              key={`item-blank-${itemElements.length}`}
            ></div>,
          )
        }
      }
    } else {
      if (ajaxStatus === EAjaxStatus.Loading && rendersStatusAsItem) {
        itemElements.push(
          <div className='item item-status' key={'item-status'}>
            loading...
          </div>,
        )
      } else if (ajaxStatus === EAjaxStatus.Error && rendersStatusAsItem) {
        itemElements.push(
          <div className='item item-status' key={'item-status'}>
            error loading
          </div>,
        )
      }
      if (blanksAreEnabled && itemsPerPage) {
        for (
          let count = rendersStatusAsItem ? 1 : 0;
          count < itemsPerPage;
          count++
        ) {
          itemElements.push(
            <div className='item item-blank' key={`item-blank-${count}`}></div>,
          )
        }
      }
    }
    return itemElements
  }

  // inherited
  render(): JSX.Element | null {
    // -- variable-definition --

    let itemsFiltered: TList[] = this.state.itemsFiltered
    // let actions: IAction_P[] = this.props.actions
    let clickable: boolean = this.props.handleSelection !== null
    let grabbable: boolean = this.props.handleGrab !== null
    let ajaxStatus: EAjaxStatus = this.props.ajaxStatus
    let listSpecificItemClassName: string | null =
      this.props.listSpecificItemClassName
    let headingText: string = this.props.headingText
    let subheadingText: string | null = this.props.subheadingText
    let itemsPerPage: number | null = this.props.itemsPerPage
    let duelPageMode: boolean = this.props.duelPageMode
    let page: number = this.state.page
    let pageCount: number = List.getTotalPages(
      itemsPerPage,
      itemsFiltered.length,
    )
    let cuttoffItemIndex: number = List.getCuttoffItemIndex(
      duelPageMode ? page + 1 : page,
      itemsPerPage,
      itemsFiltered.length,
    )
    let availableProperties: IListItemProperty[] =
      this.props.availableProperties
    let pendingEdit: boolean = this.props.pendingEdit
    let pendingDeletion: boolean = this.props.pendingDeletion
    let isPreviousPage: boolean = duelPageMode ? page > 1 : page > 0
    let isNextPage: boolean = cuttoffItemIndex < itemsFiltered.length
    let listClassName: string = 'List'
    let previousPageClassName: string = 'previous-page'
    let nextPageClassName: string = 'next-page'

    // -- class-name-logic --

    if (listSpecificItemClassName) {
      listClassName += ` ${listSpecificItemClassName}-list`
    }
    if (clickable) {
      listClassName += ' clickable'
    }
    if (grabbable) {
      listClassName += ' grabbable'
    }
    if (availableProperties.length > 0) {
      listClassName += ' items-have-properties'
    }
    if (duelPageMode) {
      listClassName += ' duel-page-mode'
    }
    if (pendingEdit) {
      listClassName += ' pending-edit'
    }
    if (pendingDeletion) {
      listClassName += ' pending-deletion'
    }
    if (!itemsPerPage) {
      previousPageClassName += ' irrelevant'
      nextPageClassName += ' irrelevant'
    } else {
      if (!isPreviousPage) {
        previousPageClassName += ' disabled'
      }
      if (!isNextPage) {
        nextPageClassName += ' disabled'
      }
    }
    if (ajaxStatus === EAjaxStatus.Loading) {
      listClassName += ' loading'
    } else if (ajaxStatus === EAjaxStatus.Error) {
      listClassName += ' error'
    }

    // -- other-logic --

    // if (
    //   ajaxStatus !== EAjaxStatus.NotLoaded &&
    //   ajaxStatus !== EAjaxStatus.Loaded
    // ) {
    //   actions = [
    //     {
    //       ...Action.defaultProps,
    //       purpose: EActionPurpose.Blank,
    //       handleClick: () => {},
    //     },
    //   ]
    // }

    // -- render --

    return (
      <div className={listClassName}>
        <div className='top'>
          <div className={previousPageClassName} onClick={this.turnBackPage}>
            {'<'}
            {isPreviousPage ? <Tooltip description={'Previous page.'} /> : null}
          </div>
          <div className='list-header'>
            <h2 className='list-heading'>
              {headingText}
              {subheadingText ? (
                <div className='subheading'>{subheadingText}</div>
              ) : null}
            </h2>
          </div>
          <div className={nextPageClassName} onClick={this.turnPage}>
            {'>'}
            {isNextPage ? <Tooltip description={'Next page.'} /> : null}
          </div>
        </div>
        {this.renderFiltering()}
        <div className='items items-1'>
          {this.renderItems(page)}
          <div className='page-number'>{`${page + 1}/${pageCount}`}</div>
        </div>
        {duelPageMode ? (
          <div className='items items-2'>
            {this.renderItems(page + 1, false)}
            {pageCount === page + 1 ? null : (
              <div className='page-number'>{`${page + 2}/${pageCount}`}</div>
            )}
          </div>
        ) : null}
        {/* <div className={'actions'}>
          {actions.map((action: IAction_P) => new Action(action).render())}
          <br />
          <div
            className='cancel-pending-action Action cancel'
            onClick={this.props.handleActionCancelation}
            key={'cancel-pending-action'}
          >
            x
            <Tooltip description={'Cancel.'} />
          </div>
        </div> */}
      </div>
    )
  }
}
