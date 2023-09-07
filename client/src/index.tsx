import React from 'react'
import ReactDOM from 'react-dom'
import './index.scss'
import App from './components/App'
import GlobalContext from 'metis/client/context'

ReactDOM.render(
  <React.StrictMode>
    <GlobalContext.Provider>
      <App />
    </GlobalContext.Provider>
  </React.StrictMode>,
  document.getElementById('root'),
)
