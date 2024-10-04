import './ListFiltering.scss'

/**
 * Provides filtering options for the `List` component,
 * currently only a search bar.
 */
export default function ListFiltering({}: TListFiltering_P): JSX.Element | null {
  return (
    <div className='ListFiltering'>
      <div className='SearchBox'>
        <div className='SearchIcon'></div>
        <input
          type='text'
          className='SearchField'
          spellCheck={false}
          placeholder={''}
          // todo: Uncomment and fix these properties.
          // onChange={this.filter}
          // onKeyDown={this.handleSearchKeyDown}
          // ref={this.searchField}
          // onFocus={() => {
          //   this.setState({ hideSearchTooltip: true })
          // }}
          // onBlur={() => {
          //   this.setState({ hideSearchTooltip: false })
          // }}
        />
        <input
          type='text'
          className='SearchHint'
          // todo: Uncomment and fix this.
          // value={filterHint}
        />
        {/* todo: Uncomment and fix this. */}
        {/* {hideSearchTooltip ? null : <Tooltip description={'Search list.'} />} */}
      </div>
      {/* {this.renderSortByMethods()} */}
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `ListFiltering`.
 */
export type TListFiltering_P = {
  // No props.
}
