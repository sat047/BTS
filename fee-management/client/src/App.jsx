import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, AuthContext } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Payments from './pages/Payments'
import StudentsList from './pages/StudentsList'
import StudentProfile from './pages/StudentProfile'
import AddEditStudent from './pages/AddEditStudent'

function ProtectedRoute({ children, token }) {
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppRoutes() {
  const { token } = React.useContext(AuthContext)

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute token={token}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/payments" 
        element={
          <ProtectedRoute token={token}>
            <Payments />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/students" 
        element={
          <ProtectedRoute token={token}>
            <StudentsList />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/students/add" 
        element={
          <ProtectedRoute token={token}>
            <AddEditStudent />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/students/:id" 
        element={
          <ProtectedRoute token={token}>
            <StudentProfile />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/students/:id/edit" 
        element={
          <ProtectedRoute token={token}>
            <AddEditStudent />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}
