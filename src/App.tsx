import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { LogoutPage } from './pages/LogoutPage'
import { HomePage } from './pages/HomePage'
import { BaoCaoHoatDongTram } from './pages/BaoCaoHoatDongTram'
import { BaoCaoTongHop } from './pages/BaoCaoTongHop'
import { CccdPage } from './pages/CccdPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/logout" element={<LogoutPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bao-cao-hoat-dong-tram"
            element={
              <ProtectedRoute>
                <BaoCaoHoatDongTram />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bao-cao-tong-hop"
            element={
              <ProtectedRoute>
                <BaoCaoTongHop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cccd"
            element={
              <ProtectedRoute>
                <CccdPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
