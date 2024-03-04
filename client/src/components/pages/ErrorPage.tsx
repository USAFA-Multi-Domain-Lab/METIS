import { IPage, TAppError } from '../App'
import './ErrorPage.scss'
import { ButtonText } from '../content/user-controls/ButtonText'
import { useListComponent } from 'src/toolbox/hooks'
import { useGlobalContext } from 'src/context'

export interface IErrorPage extends IPage {}

// This will render a page that displays a
// error that has occured.
export default function ErrorPage({}: IErrorPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  /* -- COMPONENT VARIABLES -- */

  // Extract error from globalContext.
  let error: TAppError = globalContext.error[0] ?? { message: 'Unknown error.' }
  // Resolve button props from solutions passed in error object.
  let solutions = error.solutions ?? []

  /* -- HANDLER FUNCTIONS -- */

  /**
   * Refreshes the page.
   */
  const refresh = (): void => {
    window.location.href = '/'
  }

  /* -- RENDER -- */

  // Create a list component to render
  // the solution buttons.
  const Solutions = useListComponent(ButtonText, solutions, 'componentKey')

  return (
    <div className='ErrorPage Page'>
      <div className='Message'>{error.message}</div>
      <div className='Buttons'>
        <ButtonText
          text={'Refresh'}
          handleClick={refresh}
          componentKey={'refresh-8327hkj239f'}
          key={'refresh-8327hkj239f'}
        />
        <Solutions />
      </div>
    </div>
  )
}
