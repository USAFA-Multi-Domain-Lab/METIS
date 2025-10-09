import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { TPage_P } from '.'
import ClassList from '../../../../shared/toolbox/html/class-lists'
import './LoadingPage.scss'

export interface ILoadingPage extends TPage_P {}

// This will render a loading page while the app
// is loading.
export default function LoadingPage(props: ILoadingPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const [loadingMessage] = globalContext.loadingMessage
  const [loadingProgress] = globalContext.loadingProgress
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

  return (
    <div className={rootClasses.value}>
      <div className='LoadingPageContent'>
        <div className='Message'>{loadingMessage}</div>
        <div className='LoadingProgress'>
          <div className='LoadingProgressBar' style={barStyle}></div>
        </div>
      </div>
    </div>
  )
}
