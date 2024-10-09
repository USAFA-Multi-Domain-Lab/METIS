import { useEffect } from 'react'
import { compute } from 'src/toolbox'
import Tooltip from '../../../communication/Tooltip'
import { useListContext } from '../List'
import './ListPageControls.scss'

/**
 * Provides page controls to the `List` component
 * so that the user can navigate between pages of
 * content in the list.
 */
export default function ListPageControls(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext()
  const { pageCount } = listContext
  const [pageNumber, setPageNumber] = listContext.state.pageNumber

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
  const prevPageClass = compute<string>(() => {
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

  /* -- FUNCTIONS -- */

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

  /* -- EFFECTS -- */

  // Ensure the page number is within bounds.
  useEffect(() => {
    // Update the page number to be within bounds.
    setPageNumber(Math.max(Math.min(pageNumber, pageCount - 1), 0))
  }, [pageNumber, pageCount])

  /* -- RENDER -- */

  // Render the page controls.
  return (
    <div className='ListPageControls'>
      <div className={prevPageClass} onClick={turnBack}>
        <span className='Arrow'>{'<'}</span>
        <Tooltip description={'Previous page.'} />
      </div>
      <div className='PageNumber'>{pageNumberText}</div>
      <div className={nextPageClass} onClick={turnForward}>
        <span className='Arrow'>{'>'}</span>
        <Tooltip description={'Next page.'} />
      </div>
    </div>
  )
}
