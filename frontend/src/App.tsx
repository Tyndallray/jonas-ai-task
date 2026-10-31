import { Route, Routes } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { AdminApp } from './admin/AdminApp'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { AdView } from './pages/AdView'
import { EditAd } from './pages/EditAd'
import { Home } from './pages/Home'
import { MyAds } from './pages/MyAds'
import { NewAd } from './pages/NewAd'
import { Profile } from './pages/Profile'
import { NotFound } from './pages/NotFound'

function App() {
  const auth = useAuth()

  // Covers the redirect back from Cognito while the code is exchanged for tokens
  if (auth.isLoading) return <p className="centered">Loading…</p>

  return (
    <Routes>
      <Route path="admin/*" element={<AdminApp />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="ads/:id" element={<AdView />} />
        <Route
          path="ads/new"
          element={
            <ProtectedRoute>
              <NewAd />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-ads"
          element={
            <ProtectedRoute>
              <MyAds />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-ads/:id/edit"
          element={
            <ProtectedRoute>
              <EditAd />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
