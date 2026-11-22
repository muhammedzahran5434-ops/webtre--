import { useEffect, useState } from 'react';
import { Menu, X, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { WebTrexLogo } from './WebTrexLogo';
import { useAuth } from '../context/AuthContext';
import type { AppView } from '../types';

interface NavbarProps {
  activeView: AppView;
  onNavigateView: (view: AppView) => void;
  onOpenAuth: () => void;
}

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Our Team', href: '#team' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar({ activeView, onNavigateView, onOpenAuth }: NavbarProps) {
  const { firebaseUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchorClick = (href: string) => {
    setMobileOpen(false);
    if (activeView !== 'public') {
      onNavigateView('public');
      setTimeout(() => {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-200 ${
        scrolled
          ? 'bg-[#080D1A]/95 border-white/15 shadow-lg shadow-black/20'
          : 'bg-[#080D1A]/80 border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => handleAnchorClick('#home')}
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2878FF] rounded-lg"
          aria-label="WebTrex Home"
        >
          <WebTrexLogo size={32} />
        </motion.button>

        {/* Zone 2: Clean single-line nav links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleAnchorClick(item.href);
              }}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#2878FF] hover:after:w-full after:transition-all after:duration-200"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {firebaseUser ? (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={() => onNavigateView('admin-dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={onOpenAuth}
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </motion.button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden w-11 h-11 rounded-lg border border-white/10 bg-[#0E1629] text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden border-t border-white/10 bg-[#080D1A] px-4 py-4"
          >
            <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((item, idx) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.16, delay: idx * 0.03 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAnchorClick(item.href);
                  }}
                  className="px-3 py-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
