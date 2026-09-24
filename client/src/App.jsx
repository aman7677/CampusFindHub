// src/App.jsx
// Root component — sets up routing, auth provider, and protected routes

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// ─── Page Imports ─────────────────────────────────────────────────────────────
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportItem from './pages/ReportItem';
import ItemDetail from './pages/ItemDetail';
import Dashboard from './pages/Dashboard';
import EditProfile from './pages/EditProfile';

// ─── Protected Route Wrapper ──────────────────────────────────────────────────
// Redirects unauthenticated users to /login
const ProtectedRoute = ({ children }) => {
  const { isAuth, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen" aria-label="Restoring session" />;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ─── App Layout ───────────────────────────────────────────────────────────────
// Wraps all pages with Navbar
const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items/:id" element={<ItemDetail />} />

          {/* Protected Routes — require authentication */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportItem />
              </ProtectedRoute>
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
                <EditProfile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="container-main text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} <span className="font-semibold text-gray-600">CampusFindHub</span> — Lost & Found Campus Management System
          </p>
        </div>
      </footer>
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
};

export default App;
