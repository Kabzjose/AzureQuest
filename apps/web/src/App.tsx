import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { auth as authApi } from './lib/api';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { WakingUpBanner } from './components/ui/WakingUpBanner';

// Lazy-load all page routes for low-bandwidth performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ScenarioLibraryPage = lazy(() => import('./pages/ScenarioLibraryPage'));
const ChallengePage = lazy(() => import('./pages/ChallengePage'));
const RevisePage = lazy(() => import('./pages/RevisePage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated || user?.isGuest) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setAuth, clearAuth } = useAuthStore();
  const [isWakingUp, setIsWakingUp] = useState(false);

  // On mount: try to restore session via refresh token
  useEffect(() => {
    const wakingTimer = setTimeout(() => setIsWakingUp(true), 3000);

    authApi
      .refresh()
      .then(({ accessToken, user }) => {
        // Guest sessions cannot access progress features. Return them to the
        // account-required landing page instead of opening a partial session.
        if (user.isGuest) {
          clearAuth();
          return;
        }
        setAuth(user, accessToken);
      })
      .catch(() => {
        // No valid session — user needs to authenticate
        clearAuth();
      })
      .finally(() => {
        clearTimeout(wakingTimer);
        setIsWakingUp(false);
      });
  }, [setAuth, clearAuth]);

  return (
    <BrowserRouter>
      {isWakingUp && <WakingUpBanner />}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scenarios"
            element={
              <ProtectedRoute>
                <Layout>
                  <ScenarioLibraryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scenarios/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChallengePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/revise"
            element={
              <ProtectedRoute>
                <Layout>
                  <RevisePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:attemptId"
            element={
              <ProtectedRoute>
                <Layout>
                  <ResultsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
