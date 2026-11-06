import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { authService } from './services/auth';
import { api } from './services/api';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AttackDetection from './pages/AttackDetection';
import NetworkGraph from './pages/NetworkGraph';
import AIThreatAnalysis from './pages/AIThreatAnalysis';
import DetectionHistory from './pages/DetectionHistory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ChatbotPage from './pages/ChatbotPage';
import FloatingChatbot from './components/FloatingChatbot';

// Protected Route Wrapper
const ProtectedLayout = () => {
  const isAuth = authService.isAuthenticated();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const navigate = useNavigate();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  const handleTriggerDemo = async () => {
    setIsDemoLoading(true);
    try {
      await api.loadDemoData();
      // Navigate to detection page to show results
      navigate('/detect');
    } catch (err) {
      console.error("Failed to inject demo telemetry:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      <Navbar onTriggerDemo={handleTriggerDemo} isDemoLoading={isDemoLoading} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#070B14]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/detect" element={<AttackDetection />} />
            <Route path="/graph" element={<NetworkGraph />} />
            <Route path="/analysis" element={<AIThreatAnalysis />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/history" element={<DetectionHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {/* Floating ChatGPT SOC Analyst Chatbot accessible across all pages */}
      <FloatingChatbot />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </Router>
  );
}
