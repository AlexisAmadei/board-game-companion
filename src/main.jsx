import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './view/App'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import JoinRoom from './view/JoinRoom'
import Host from './view/Host'
import Display from './view/Display'
import NotFound from './view/NotFound'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/join'>
          <Route path=':roomId' element={<JoinRoom />} />
        </Route>
        <Route path='/host' element={<Host />} />
        <Route path='/display'>
          <Route path=':roomId' element={<Display />} />
        </Route>
        <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
