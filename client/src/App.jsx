import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import CompanyDashboard from './pages/company/CompanyDashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import PlacementDashboard from './pages/placement/PlacementDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Home/Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Dashboard Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          <Route path="/placement/dashboard" element={<PlacementDashboard />} />
          
          {/* Default redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

