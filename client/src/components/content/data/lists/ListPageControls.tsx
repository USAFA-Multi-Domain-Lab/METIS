import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import './ListPageControls.scss'

/**
 * Provides page controls to the `List` component
 * so that the user can navigate between pages of
 * content in the list.
 */
export default function ListPageControls({
  pageNumberState: [pageNumber, setPageNumber],
  pageCount,
}: TListPageControls_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * Whether there is a previous page.
   */
  const isPreviousPage = compute<boolean>(() => pageNumber > 0)

  /**
   * Whether there is a next page.
   */
  const isNextPage = compute<boolean>(() => pageNumber < pageCount - 1)

  /**
   * The class name for the previous page control.
   */
  const previousPageClass = compute<string>(() => {
    let results = ['PrevPage']

    // If there is not a previous page, disable the control.
    if (!isPreviousPage) results.push('Disabled')

    return results.join(' ')
  })

  /**
   * The class name for the next page control.
   */
  const nextPageClass = compute<string>(() => {
    let results = ['NextPage']

    // If there is not a next page, disable the control.
    if (!isNextPage) results.push('Disabled')

    return results.join(' ')
  })

  /**
   * The text to display for the page number.
   */
  const pageNumberText = compute<string>(() => `${pageNumber + 1}/${pageCount}`)

  /* -- HANDLERS -- */

  /**
   * Turns the page back.
   */
  const turnBack = () => {
    if (isPreviousPage) setPageNumber(pageNumber - 1)
  }

  /**
   * Turns the page forward.
   */
  const turnForward = () => {
    if (isNextPage) setPageNumber(pageNumber + 1)
  }

  /* -- RENDER -- */

  // Render the page controls.
  return (
    <div className='ListPageControls'>
      {/* <div className={previousPageClassName} onClick={this.turnBackPage}>
        <span className='arrow'>{'<'}</span>
        {isPreviousPage ? <Tooltip description={'Previous page.'} /> : null}
      </div>
      <div className='page-number'>{`${page + 1}/${pageCount}`}</div>
      <div className={nextPageClassName} onClick={this.turnPage}>
        <span className='arrow'>{'>'}</span>
        {isNextPage ? <Tooltip description={'Next page.'} /> : null}
      </div> */}
      {/* todo: Make this dynamic. */}
      <div className={previousPageClass} onClick={turnBack}>
        <span className='Arrow'>{'<'}</span>
        <Tooltip description={'Previous page.'} />
      </div>
      <div className='PageNumber'>{pageNumberText}</div>
      <div className={nextPageClass}>
        <span className='Arrow' onClick={turnForward}>
          {'>'}
        </span>
        <Tooltip description={'Next page.'} />
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `ListPageControls`.
 */
export type TListPageControls_P = {
  /**
   * The state for the current page number.
   */
  pageNumberState: [number, TReactSetter<number>]
  /**
   * The number of pages in the list.
   */
  pageCount: number
}
