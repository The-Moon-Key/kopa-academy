import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/apprentice/DashboardPage';
import { ProjectsPage } from './pages/apprentice/ProjectsPage';
import { ProjectDetailPage } from './pages/apprentice/ProjectDetailPage';
import { LayerDetailPage } from './pages/apprentice/LayerDetailPage';
import { KnowledgeChecksPage } from './pages/apprentice/KnowledgeChecksPage';
import { KnowledgeCheckSessionPage } from './pages/apprentice/KnowledgeCheckSessionPage';
import { PortfolioPage } from './pages/apprentice/PortfolioPage';
import { CoachDashboardPage } from './pages/coach/CoachDashboardPage';
import { ReviewPage } from './pages/coach/ReviewPage';
import { ApprenticeListPage } from './pages/coach/ApprenticeListPage';
import { KCTranscriptsPage } from './pages/coach/KCTranscriptsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { CohortManagementPage } from './pages/admin/CohortManagementPage';
import { AIPromptsPage } from './pages/admin/AIPromptsPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { KCOverridePage } from './pages/admin/KCOverridePage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Apprentice routes (accessible by all authenticated users) */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/layers/:layerId" element={<LayerDetailPage />} />
        <Route path="/knowledge-checks" element={<KnowledgeChecksPage />} />
        <Route path="/knowledge-checks/:sessionId" element={<KnowledgeCheckSessionPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />

        {/* Coach routes */}
        <Route
          path="/coach"
          element={
            <ProtectedRoute allowedRoles={['coach', 'admin']}>
              <CoachDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/review/:attemptId"
          element={
            <ProtectedRoute allowedRoles={['coach', 'admin']}>
              <ReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/apprentices"
          element={
            <ProtectedRoute allowedRoles={['coach', 'admin']}>
              <ApprenticeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/transcripts"
          element={
            <ProtectedRoute allowedRoles={['coach', 'admin']}>
              <KCTranscriptsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cohorts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CohortManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/prompts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AIPromptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-log"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kc-override"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <KCOverridePage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
