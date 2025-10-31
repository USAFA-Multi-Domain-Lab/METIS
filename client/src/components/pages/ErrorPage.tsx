import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useListComponent } from 'src/toolbox/hooks'
import { TPage_P } from '.'
import ClassList from '../../../../shared/toolbox/html/ClassList'
import { TAppError } from '../App'
import { ButtonText } from '../content/user-controls/buttons/ButtonText'
import './ErrorPage.scss'

export interface IErrorPage extends TPage_P {}

// This will render a page that displays a
// error that has occured.
export default function ErrorPage({}: IErrorPage): TReactElement | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [backgroundLoaded] = globalContext.backgroundLoaded

  /* -- FUNCTIONS -- */

  /**
   * Refreshes the page.
   */
  const refresh = (): void => {
    window.location.href = '/'
  }

  /* -- COMPUTED -- */

  /**
   * The error object extracted from global context or a default error.
   */
  const error = compute<TAppError>(
    () =>
      globalContext.error[0] ?? {
        message:
          'Unexpected error. Please try again or contact an administrator.',
      },
  )

  /**
   * The solution button props resolved from the error object.
   */
  const solutions = compute<any[]>(() => error.solutions ?? [])

  /**
   * Classes to apply to the root element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('ErrorPage', 'Page').switch(
      'BackgroundImageLarge',
      'BackgroundImageSmall',
      backgroundLoaded,
    ),
  )

  /* -- RENDER -- */

  // Create a list component to render
  // the solution buttons.
  const Solutions = useListComponent(ButtonText, solutions, 'text')

  return (
    <div className={rootClasses.value}>
      <div className='Message'>{error.message}</div>
      <div className='Buttons'>
        <ButtonText
          text={'Refresh'}
          onClick={refresh}
          key={'refresh-8327hkj239f'}
        />
        <Solutions />
      </div>
    </div>
  )
}
