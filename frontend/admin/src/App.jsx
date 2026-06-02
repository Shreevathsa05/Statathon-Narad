import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Sidebar from './components/Sidebar.jsx';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import SetupPasswordPage from './pages/SetupPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import SDRDDashboard from './pages/sdrd/SDRDDashboard.jsx';
import AIPromptBuilder from './pages/sdrd/AIPromptBuilder.jsx';
import ManualBuilder from './pages/sdrd/ManualBuilder.jsx';
import SurveyEditor from './pages/sdrd/SurveyEditor.jsx';
import FODPage from './pages/fod/FODPage.jsx';
import DPDPage from './pages/dpd/DPDPage.jsx';
import CQCDPage from './pages/cqcd/CQCDPage.jsx';
import FieldManagerPage from './pages/field-manager/FieldManagerPage.jsx';
import FieldAgentPage from './pages/field-agent/FieldAgentPage.jsx';

// Shell Layout
function AppShell() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Unauthenticated Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup-password" element={<SetupPasswordPage />} />

          {/* Protected Routes (requires login) */}
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Root Admin Routes */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']}><Outlet /></ProtectedRoute>}>
              <Route path="users" element={<UsersPage />} />
            </Route>

            {/* SDRD Routes */}
            <Route path="sdrd" element={<ProtectedRoute allowedRoles={['admin', 'sdrd']}><Outlet /></ProtectedRoute>}>
              <Route index element={<SDRDDashboard />} />
              <Route path="ai-builder" element={<AIPromptBuilder />} />
              <Route path="manual-builder" element={<ManualBuilder />} />
              <Route path="editor/:surveyId" element={<SurveyEditor />} />
            </Route>

            {/* FOD Routes */}
            <Route path="fod" element={<ProtectedRoute allowedRoles={['admin', 'fod']}><Outlet /></ProtectedRoute>}>
              <Route index element={<FODPage />} />
              <Route path="managers" element={<UsersPage />} /> {/* Reused UsersPage for FOD */}
            </Route>

            {/* Field Manager Routes */}
            <Route path="fod-manager" element={<ProtectedRoute allowedRoles={['admin', 'field_manager']}><Outlet /></ProtectedRoute>}>
              <Route index element={<FieldManagerPage />} />
              <Route path="agents" element={<UsersPage />} /> {/* Reused UsersPage for Field Manager */}
            </Route>

            {/* Field Agent Routes */}
            <Route path="field-agent" element={<ProtectedRoute allowedRoles={['admin', 'field_agent']}><FieldAgentPage /></ProtectedRoute>} />

            {/* DPD Routes */}
            <Route path="dpd" element={<ProtectedRoute allowedRoles={['admin', 'dpd']}><DPDPage /></ProtectedRoute>} />

            {/* CQCD Routes */}
            <Route path="cqcd" element={<ProtectedRoute allowedRoles={['admin', 'cqcd']}><CQCDPage /></ProtectedRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
