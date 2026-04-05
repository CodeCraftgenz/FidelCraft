import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/auth-provider';
import { PageLoader } from './components/ui';
import { DashboardLayout } from './components/layouts/dashboard-layout';

const LandingPage = lazy(() => import('./pages/public/landing-page').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/auth/login-page').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/register-page').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const StorePage = lazy(() => import('./pages/public/store-page').then(m => ({ default: m.StorePage })));
const MemberDashboardPage = lazy(() => import('./pages/public/member-dashboard-page').then(m => ({ default: m.MemberDashboardPage })));
const OverviewPage = lazy(() => import('./pages/dashboard/overview-page').then(m => ({ default: m.OverviewPage })));
const ProgramsPage = lazy(() => import('./pages/dashboard/programs-page').then(m => ({ default: m.ProgramsPage })));
const MembersPage = lazy(() => import('./pages/dashboard/members-page').then(m => ({ default: m.MembersPage })));
const TransactionsPage = lazy(() => import('./pages/dashboard/transactions-page').then(m => ({ default: m.TransactionsPage })));
const RewardsPage = lazy(() => import('./pages/dashboard/rewards-page').then(m => ({ default: m.RewardsPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/l/:slug" element={<StorePage />} />
        <Route path="/membro/:memberId" element={<MemberDashboardPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<OverviewPage />} />
          <Route path="programas" element={<ProgramsPage />} />
          <Route path="membros" element={<MembersPage />} />
          <Route path="transacoes" element={<TransactionsPage />} />
          <Route path="premios" element={<RewardsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground"><AppRoutes /></div>
    </AuthProvider>
  );
}
