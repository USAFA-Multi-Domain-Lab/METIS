import ReactDOM from 'react-dom/client'
import GlobalContext from 'src/context'
import App from './components/App'
import './index.scss'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <GlobalContext.Provider>
    <App />
  </GlobalContext.Provider>,
)
