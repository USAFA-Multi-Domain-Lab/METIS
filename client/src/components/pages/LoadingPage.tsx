import { useGlobalContext } from 'metis/client/context/global'
import { compute } from 'metis/client/toolbox'
import { useListComponent } from 'metis/client/toolbox/hooks'
import { ClassList } from 'metis/toolbox'
import { ButtonText } from '../content/user-controls/buttons/ButtonText'
import './LoadingPage.scss'

// This will render a loading page while the app
// is loading.
export default function LoadingPage(): TReactElement | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const [loadingMessage] = globalContext.loadingMessage
  const [loadingProgress] = globalContext.loadingProgress
  const [loadingButtons] = globalContext.loadingButtons
  const [backgroundLoaded] = globalContext.backgroundLoaded

  /* -- COMPUTED -- */

  /**
   * Classes to apply to the root element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('LoadingPage', 'Page').switch(
      'BackgroundImageLarge',
      'BackgroundImageSmall',
      backgroundLoaded,
    ),
  )

  /**
   * Computes inline-styles for the loading progress bar.
   */
  const barStyle = compute<React.CSSProperties>(() => {
    return {
      width: `${loadingProgress}%`,
    }
  })

  /* -- RENDER -- */

  // Create a list component to render
  // the loading buttons.
  const LoadingButtons = useListComponent(ButtonText, loadingButtons, 'text')

  return (
    <div className={rootClasses.value}>
      <div className='LoadingPageContent'>
        <div className='Message'>{loadingMessage}</div>
        <div className='LoadingProgress'>
          <div className='LoadingProgressBar' style={barStyle}></div>
        </div>
        <div className='LoadingButtons'>
          <LoadingButtons />
        </div>
      </div>
    </div>
  )
}
