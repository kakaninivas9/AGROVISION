import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/UI/ErrorBoundary';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Lazy Loaded Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const DiseaseDetection = React.lazy(() => import('./pages/DiseaseDetection'));
const AIAssistant = React.lazy(() => import('./pages/AIAssistant'));
const WeatherRisk = React.lazy(() => import('./pages/WeatherRisk'));
const IncomeAdvisor = React.lazy(() => import('./pages/IncomeAdvisor'));
const GovtSchemes = React.lazy(() => import('./pages/GovtSchemes'));
const CommunityBoard = React.lazy(() => import('./pages/CommunityBoard'));
const FieldMonitoring = React.lazy(() => import('./pages/FieldMonitoring'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-obsidian-dark">
    <div className="flex gap-2">
      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
    </div>
  </div>
);

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#16213E',
                color: '#E2E8F0',
                border: '1px solid rgba(255,255,255,0.08)',
              },
              success: { iconTheme: { primary: '#00FF88', secondary: '#060B14' } },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Private — wrapped in sidebar layout */}
              <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
              <Route path="/field-monitoring" element={<PrivateRoute><DashboardLayout><FieldMonitoring /></DashboardLayout></PrivateRoute>} />
              <Route path="/detect" element={<PrivateRoute><DashboardLayout><DiseaseDetection /></DashboardLayout></PrivateRoute>} />
              <Route path="/assistant" element={<PrivateRoute><DashboardLayout><AIAssistant /></DashboardLayout></PrivateRoute>} />
              <Route path="/weather" element={<PrivateRoute><DashboardLayout><WeatherRisk /></DashboardLayout></PrivateRoute>} />
              <Route path="/income" element={<PrivateRoute><DashboardLayout><IncomeAdvisor /></DashboardLayout></PrivateRoute>} />
              <Route path="/schemes" element={<PrivateRoute><DashboardLayout><GovtSchemes /></DashboardLayout></PrivateRoute>} />
              <Route path="/community" element={<PrivateRoute><DashboardLayout><CommunityBoard /></DashboardLayout></PrivateRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
