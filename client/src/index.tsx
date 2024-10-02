import ReactDOM from 'react-dom/client'
import GlobalContext from 'src/context'
import App from './components/App'
import ErrorPage from './components/pages/ErrorPage'
import './global.d.ts'
import './index.scss'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error caught:', {
    message,
    source,
    lineno,
    colno,
    error,
  })

  root.render(<ErrorPage />)
}

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)

  root.render(<ErrorPage />)
}

root.render(
  <GlobalContext.Provider>
    <App />
  </GlobalContext.Provider>,
)

declare global {
  type TTest = 'string'
}
