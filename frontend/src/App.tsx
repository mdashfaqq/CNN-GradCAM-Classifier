import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import InspectPage from './pages/InspectPage'
import InspectionResultPage from './pages/InspectionResultPage'
import DashboardPage from './pages/DashboardPage'
import InspectionsPage from './pages/InspectionsPage'
import MapPage from './pages/MapPage'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/inspect"
          element={
            <Layout>
              <InspectPage />
            </Layout>
          }
        />
        <Route
          path="/inspection/:id"
          element={
            <Layout>
              <InspectionResultPage />
            </Layout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route
          path="/inspections"
          element={
            <Layout>
              <InspectionsPage />
            </Layout>
          }
        />
        <Route
          path="/map"
          element={
            <Layout>
              <MapPage />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
