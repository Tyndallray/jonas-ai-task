import { Route, Routes } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { NotFound } from './pages/NotFound'

function App() {
  const auth = useAuth()

  // Covers the redirect back from Cognito while the code is exchanged for tokens
  if (auth.isLoading) return <p className="centered">Loading…</p>

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
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
