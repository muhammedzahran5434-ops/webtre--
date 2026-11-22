/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePublicSiteData } from './hooks/usePublicSiteData';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { PublicSite } from './components/PublicSite';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import type { AppView } from './types';

function WebTrexAppShell() {
  const { firebaseUser, authReady } = useAuth();
  const siteData = usePublicSiteData();

  const [activeView, setActiveView] = useState<AppView>('public');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingRedirectAfterAuth, setPendingRedirectAfterAuth] = useState(false);

  useEffect(() => {
    if (pendingRedirectAfterAuth && authReady && firebaseUser) {
      setActiveView('admin-dashboard');
      setPendingRedirectAfterAuth(false);
      setAuthModalOpen(false);
    }
  }, [pendingRedirectAfterAuth, authReady, firebaseUser]);

  useEffect(() => {
    if (authReady && !firebaseUser && activeView !== 'public') {
      setActiveView('public');
    }
  }, [authReady, firebaseUser, activeView]);

  const handleNavigateView = (view: AppView) => {
    if (view !== 'public') {
      if (!firebaseUser) {
        setAuthModalOpen(true);
        return;
      }
      setActiveView('admin-dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveView('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080D1A] text-slate-100">
      <AnimatePresence mode="wait">
        {activeView === 'public' ? (
          <motion.div
            key="public-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Navbar
              activeView={activeView}
              onNavigateView={handleNavigateView}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
            <PublicSite
              siteData={siteData}
              onOpenAuth={() => setAuthModalOpen(true)}
              onNavigateView={handleNavigateView}
            />
          </motion.div>
        ) : (
          firebaseUser && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <AdminDashboard siteData={siteData} onNavigateView={handleNavigateView} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      <AuthModal
        open={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingRedirectAfterAuth(false);
        }}
        onAuthenticated={() => {
          setPendingRedirectAfterAuth(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <WebTrexAppShell />
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
