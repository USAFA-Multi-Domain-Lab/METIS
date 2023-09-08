import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './components/App'
import GlobalContext from 'src/context'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <GlobalContext.Provider>
      <App />
    </GlobalContext.Provider>
  </React.StrictMode>,
)
