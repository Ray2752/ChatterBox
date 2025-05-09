import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Route, Routes, Navigate } from 'react-router'
import HomePage from './pages/HomePage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import CallPage from './pages/CallPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import PageLoader from './components/PageLoader.jsx'
import useAuthUser from './hooks/useAuthUser.js'
import Layout from './components/Layout.jsx'
import { useThemeStore } from './store/useThemeStore.js'

const App = () => {
  const { isLoading, authUser } = useAuthUser()
  const isAuthenticated = Boolean(authUser)
  const isOnBoarded = authUser?.isOnBoarded
  const { theme } = useThemeStore()

  if (isLoading) return <PageLoader />

  // Componente de ruta protegida reutilizable
  const ProtectedRoute = ({ element, fullScreen = false }) => {
    if (!isAuthenticated) return <Navigate to="/login" />
    if (!isOnBoarded) return <Navigate to="/onboarding" />
    
    return fullScreen ? element : <Layout showSidebar={true}>{element}</Layout>
  }

  return (
    <div className='h-screen' data-theme={theme}>
      <Routes>
        <Route
          path='/'
          element={<ProtectedRoute element={<HomePage />} />}
        />
        
        <Route
          path='/signup'
          element={!isAuthenticated ? <SignUpPage /> : <Navigate to={isOnBoarded ? "/" : "/onboarding"} />}
        />
        
        <Route
          path='/login'
          element={!isAuthenticated ? <LoginPage /> : <Navigate to={isOnBoarded ? "/" : "/onboarding"} />}
        />
        
        <Route
          path="/notifications"
          element={<ProtectedRoute element={<NotificationsPage />} />}
        />
        
        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnBoarded ? (
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        
        <Route
           path="/call/:id"
          element={
            isAuthenticated && isOnBoarded ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              !isOnBoarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>

      <Toaster position="bottom-right" />
    </div>
  )
}

export default App