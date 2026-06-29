import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './view/App'
import JoinRoom from './view/JoinRoom'
import Host from './view/Host'
import Display from './view/Display'
import NotFound from './view/NotFound'
import './index.css'
import DefaultLayout from './Layouts/DefaultLayout'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<DefaultLayout />}>
            <Route path='/' element={<App />} />
            <Route path='/join'>
              <Route path=':roomId' element={<JoinRoom />} />
            </Route>
            <Route path='/host' element={<Host />} />
            <Route path='/display'>
              <Route path=':roomId' element={<Display />} />
            </Route>
            <Route path='*' element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
