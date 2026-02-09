import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import CompanyDashboard from './pages/company/CompanyDashboard';
import PostJob from './pages/company/PostJob';
import ManageJobs from './pages/company/ManageJobs';
import MentorDashboard from './pages/mentor/MentorDashboard';
import PlacementDashboard from './pages/placement/PlacementDashboard';
import VerifyCompanies from './pages/placement/VerifyCompanies';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Routes>
            {/* Home/Landing Page */}
            <Route path="/" element={<Home />} />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Student Routes */}
            <Route 
              path="/student/dashboard" 
              element={<ProtectedRoute element={<StudentDashboard />} requiredRole="student" />} 
            />
            
            {/* Company Routes */}
            <Route 
              path="/company/dashboard" 
              element={<ProtectedRoute element={<CompanyDashboard />} requiredRole="company" />} 
            />
            <Route 
              path="/company/post-job" 
              element={<ProtectedRoute element={<PostJob />} requiredRole="company" />} 
            />
            <Route 
              path="/company/manage-jobs" 
              element={<ProtectedRoute element={<ManageJobs />} requiredRole="company" />} 
            />
            
            {/* Mentor Routes */}
            <Route 
              path="/mentor/dashboard" 
              element={<ProtectedRoute element={<MentorDashboard />} requiredRole="mentor" />} 
            />
            
            {/* Placement Routes */}
            <Route 
              path="/placement/dashboard" 
              element={<ProtectedRoute element={<PlacementDashboard />} requiredRole="placement" />} 
            />
            <Route 
              path="/placement/verify-companies" 
              element={<ProtectedRoute element={<VerifyCompanies />} requiredRole="placement" />} 
            />
            
            {/* Default redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

