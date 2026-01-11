import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ClubProvider } from './contexts/ClubContext'
import { MovieProvider } from './contexts/MovieContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ClubMembersPage from './pages/ClubMembersPage'
import ClubPage from './pages/ClubPage'
import ClubSettingsPage from './pages/ClubSettingsPage'
import Dashboard from './pages/Dashboard'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import MovieHistoryPage from './pages/MovieHistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SignUpPage from './pages/SignUpPage'
import VerifyError from './pages/VerifyError'
import VerifySuccess from './pages/VerifySuccess'

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <ClubProvider>
            <MovieProvider>
              <Header />
              <Routes>
                <Route
                  path="/"
                  element={
                    <PublicOnlyRoute>
                      <LandingPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicOnlyRoute>
                      <SignUpPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicOnlyRoute>
                      <ForgotPasswordPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <PublicOnlyRoute>
                      <ResetPasswordPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clubs/:id"
                  element={
                    <ProtectedRoute>
                      <ClubPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clubs/:id/members"
                  element={
                    <ProtectedRoute>
                      <ClubMembersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clubs/:id/settings"
                  element={
                    <ProtectedRoute>
                      <ClubSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clubs/:id/movies/history"
                  element={
                    <ProtectedRoute>
                      <MovieHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/verify-success" element={<VerifySuccess />} />
                <Route path="/verify-error" element={<VerifyError />} />
              </Routes>
            </MovieProvider>
          </ClubProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
