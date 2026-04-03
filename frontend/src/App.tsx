import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { EventList } from './components/EventList'
import { EventSetup } from './components/EventSetup'
import { EventPage } from './components/EventPage'
import '@mantine/core/styles.css'
import './App.css'

function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div className="app-wrapper">
              <div className="background-layer dark-theme" />
              <div className="content-layer">
                <EventList />
              </div>
            </div>
          } />
          <Route path="/new" element={
            <div className="app-wrapper">
              <div className="background-layer dark-theme" />
              <div className="content-layer">
                <EventSetup />
              </div>
            </div>
          } />
          <Route path="/event/:eventId" element={<EventPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  )
}

export default App
