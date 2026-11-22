import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Compass,
  Award,
  Layers,
  X,
  ExternalLink,
  Linkedin,
  Github,
  Twitter,
  UserPlus,
  Send,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const staggerGrid = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const staggerCard = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
};
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, sanitizeExternalUrl, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  HERO_VISUAL_URL,
  PROJECT_TYPE_OPTIONS,
  BUDGET_OPTIONS,
} from '../data/defaults';
import type { PublicSiteData } from '../hooks/usePublicSiteData';
import type { PortfolioProject, ProjectCategory, ServiceItem, AppView } from '../types';
import { ServiceIcon } from './ServiceIcon';
import { WebTrexLogo } from './WebTrexLogo';

interface PublicSiteProps {
  siteData: PublicSiteData;
  onOpenAuth: () => void;
  onNavigateView: (view: AppView) => void;
}

const WHY_CHOOSE_ITEMS = [
  {
    number: '01.',
    title: 'Creative and modern solutions',
    description:
      'Every product is shaped around your specific audience and goals—never forced into rigid, recycled templates.',
  },
  {
    number: '02.',
    title: 'Responsive designs',
    description:
      'Fluid layouts engineered and tested across mobile phones, tablets, laptops, and widescreen desktop monitors.',
  },
  {
    number: '03.',
    title: 'User-friendly experiences',
    description:
      'Clear navigation, accessible contrast, and intuitive workflows that help visitors accomplish tasks without friction.',
  },
  {
    number: '04.',
    title: 'Reliable development',
    description:
      'Clean TypeScript architecture, structured databases, and defensive error handling built for long-term stability.',
  },
  {
    number: '05.',
    title: 'Attention to detail',
    description:
      'Disciplined spacing, crisp typography, semantic markup, and thoughtful edge-case coverage from start to finish.',
  },
  {
    number: '06.',
    title: 'Continuous improvement',
    description:
      'Post-launch monitoring, iterative enhancements, and dependable technical support as your organization scales.',
  },
];

const CONFIGURABLE_TEAM_SLOTS = [
  {
    role: 'Lead Web Architect',
    focus: 'Full-stack web platforms, database modeling, and performance engineering.',
  },
  {
    role: 'UI/UX Product Designer',
    focus: 'Information architecture, responsive design systems, and accessible interfaces.',
  },
  {
    role: 'Application & Android Engineer',
    focus: 'Web applications, native Android experiences, and API integrations.',
  },
];

function ResilientImage({
  src,
  alt,
  className,
  fallbackTitle,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-gradient-to-br from-[#0E1629] via-[#131E36] to-[#080D1A] flex flex-col items-center justify-center p-6 text-center ${className || ''}`}
      >
        <Layers className="w-8 h-8 text-[#2878FF] mb-3" />
        <span className="text-sm font-medium text-slate-300">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function PublicSite({ siteData, onOpenAuth, onNavigateView }: PublicSiteProps) {
  const { firebaseUser } = useAuth();
  const { siteContent, services, projects, teamMembers } = siteData;

  const [projectFilter, setProjectFilter] = useState<'All' | ProjectCategory>('All');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Contact form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState(PROJECT_TYPE_OPTIONS[0]);
  const [budget, setBudget] = useState('');
  const [details, setDetails] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (projectFilter === 'All') return projects;
    return projects.filter((p) => p.category === projectFilter);
  }, [projects, projectFilter]);

  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRequestWithService = (serviceTitle: string) => {
    setSelectedService(null);
    const match = PROJECT_TYPE_OPTIONS.find((opt) =>
      opt.toLowerCase().includes(serviceTitle.toLowerCase().split(' ')[0]),
    );
    if (match) {
      setProjectType(match);
    } else {
      setProjectType(serviceTitle.slice(0, 80));
    }
    scrollToSection('#contact');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanDetails = details.trim();
    const cleanType = projectType.trim() || 'Website Development';
    const cleanBudget = budget.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      setContactError('Please enter your full name (2 to 100 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      setContactError('Please enter a valid email address.');
      return;
    }
    if (cleanDetails.length < 10 || cleanDetails.length > 2000) {
      setContactError('Please share at least 10 characters about your project details.');
      return;
    }

    setContactSubmitting(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        fullName: cleanName.slice(0, 100),
        email: cleanEmail.slice(0, 254),
        projectType: cleanType.slice(0, 80),
        budget: cleanBudget.slice(0, 60),
        details: cleanDetails.slice(0, 2000),
        userId: firebaseUser?.uid || '',
        status: 'new',
        replyMessage: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setFullName('');
      setEmail('');
      setBudget('');
      setDetails('');
      setContactSuccess(
        'Your inquiry has been saved and delivered to the WebTrex team. We will review your project scope and respond shortly.',
      );
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'contact_messages');
      } catch {
        setContactError(
          'Unable to submit your message right now. Please check your connection and try again.',
        );
      }
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <main className="bg-[#080D1A] text-slate-100">
      {/* =========================================================
          1. HERO SECTION
      ========================================================= */}
      <section id="home" className="relative pt-14 pb-20 lg:pt-20 lg:pb-28 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-stretch">
            {/* Left Copy Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
              className="lg:col-span-6 flex flex-col justify-center"
            >
              <motion.p
                variants={staggerCard}
                className="text-sm font-medium text-[#5B9BFF] mb-4 tracking-wide"
              >
                WebTrex — Your Vision. Our Creation.
              </motion.p>

              <motion.h1
                variants={staggerCard}
                className="font-display font-bold text-white tracking-tight leading-[1.1] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)' }}
              >
                {siteContent.heroHeadline}
              </motion.h1>

              <motion.p
                variants={staggerCard}
                className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl"
              >
                {siteContent.heroDescription}
              </motion.p>

              <motion.div
                variants={staggerCard}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                  onClick={() => scrollToSection('#services')}
                  className="px-6 py-3.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Our Services</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                  onClick={() => scrollToSection('#contact')}
                  className="px-6 py-3.5 rounded-lg bg-[#0E1629] hover:bg-[#141F38] border border-white/15 text-slate-100 text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Start a Project</span>
                </motion.button>
              </motion.div>

              {/* Clean unboxed capability list */}
              <motion.div
                variants={staggerCard}
                className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6"
              >
                <div>
                  <p className="text-sm font-semibold text-white">Web &amp; SaaS</p>
                  <p className="text-xs text-slate-400 mt-1">Modern sites &amp; web apps</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Android Apps</p>
                  <p className="text-xs text-slate-400 mt-1">Native mobile engineering</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">UI/UX &amp; Custom</p>
                  <p className="text-xs text-slate-400 mt-1">Tailored software craft</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual Showcase Column */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
              className="lg:col-span-6 flex"
            >
              <div className="group w-full rounded-2xl bg-[#0E1629] border border-white/10 hover:border-white/20 transition-colors overflow-hidden flex flex-col">
                {/* Clean window bar */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#0B1222]">
                  <span className="text-xs font-medium text-slate-400">
                    WebTrex Digital Architecture
                  </span>
                  <span className="text-xs text-slate-500">Web · Android · UI/UX</span>
                </div>

                <div className="relative flex-1 min-h-[280px] sm:min-h-[360px] overflow-hidden">
                  <ResilientImage
                    src={HERO_VISUAL_URL}
                    alt="Modern WebTrex engineering studio workspace and interface previews"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    fallbackTitle="WebTrex Digital Workspace"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A]/85 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#5B9BFF] font-medium">Full-Lifecycle Delivery</p>
                      <p className="text-sm sm:text-base font-semibold text-white mt-0.5">
                        Interface Design · Engineering · Ongoing Support
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. ABOUT WEBTREX
      ========================================================= */}
      <section id="about" className="py-20 lg:py-28 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-medium text-[#5B9BFF] mb-3">About WebTrex</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              {siteContent.aboutHeadline}
            </h2>
            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              {siteContent.aboutDescription}
            </p>
          </motion.div>

          {/* Mission, Vision, Values - Hairline Editorial Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerGrid}
            className="mt-14 pt-12 border-t border-white/10 grid md:grid-cols-3 gap-10"
          >
            <motion.div variants={staggerCard}>
              <h3 className="text-base font-semibold text-white mb-2.5">Our Mission</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{siteContent.mission}</p>
            </motion.div>
            <motion.div variants={staggerCard}>
              <h3 className="text-base font-semibold text-white mb-2.5">Our Vision</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{siteContent.vision}</p>
            </motion.div>
            <motion.div variants={staggerCard}>
              <h3 className="text-base font-semibold text-white mb-2.5">Our Values</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{siteContent.values}</p>
            </motion.div>
          </motion.div>

          {/* Three Feature Cards: Innovation, Creativity, Quality */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerGrid}
            className="mt-14 grid md:grid-cols-3 gap-6"
          >
            <motion.div
              variants={staggerCard}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="p-7 rounded-2xl bg-[#0E1629] border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#2878FF]/10 border border-[#2878FF]/25 flex items-center justify-center mb-5">
                <Sparkles className="w-5 h-5 text-[#2878FF]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Innovation</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Applying modern web frameworks, native Android capabilities, and scalable cloud
                databases to give your product a durable technical foundation.
              </p>
            </motion.div>

            <motion.div
              variants={staggerCard}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="p-7 rounded-2xl bg-[#0E1629] border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#2878FF]/10 border border-[#2878FF]/25 flex items-center justify-center mb-5">
                <Compass className="w-5 h-5 text-[#2878FF]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Creativity</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Designing intentional visual systems and interactive journeys that reflect your
                brand personality instead of generic industry patterns.
              </p>
            </motion.div>

            <motion.div
              variants={staggerCard}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="p-7 rounded-2xl bg-[#0E1629] border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#2878FF]/10 border border-[#2878FF]/25 flex items-center justify-center mb-5">
                <Award className="w-5 h-5 text-[#2878FF]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Quality</h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                Enforcing clean code standards, responsive fidelity across breakpoints, and
                thorough verification before every milestone reaches production.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          3. SERVICES
      ========================================================= */}
      <section id="services" className="py-20 lg:py-28 border-b border-white/10 bg-[#0A1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#5B9BFF] mb-3">Our Services</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                Focused capabilities across web, mobile, and software.
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              From business websites and redesigns to custom software and long-term maintenance.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerGrid}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={staggerCard}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="group p-7 rounded-2xl bg-[#0E1629] border border-white/10 hover:border-[#2878FF]/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#2878FF]/10 border border-[#2878FF]/25 flex items-center justify-center mb-6 transition-transform duration-200 group-hover:scale-105">
                    <ServiceIcon icon={service.icon} className="w-5 h-5 text-[#2878FF]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B9BFF] hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Learn More</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          4. OUR WORK / PROJECTS
      ========================================================= */}
      <section id="projects" className="py-20 lg:py-28 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12"
          >
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#5B9BFF] mb-3">Our Work</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                Selected concepts and digital builds.
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Sample demonstrations illustrating our engineering and design standards, clearly
                labeled alongside live client launches as they are published.
              </p>
            </div>

            {/* Interactive Filter Tabs with sliding indicator */}
            <div
              className="inline-flex items-center gap-1 p-1 bg-[#0E1629] border border-white/10 rounded-lg self-start"
              role="group"
              aria-label="Filter projects by category"
            >
              {(['All', 'Websites', 'Applications', 'UI/UX'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setProjectFilter(cat)}
                  className={`relative px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    projectFilter === cat ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {projectFilter === cat && (
                    <motion.span
                      layoutId="projectFilterActive"
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className="absolute inset-0 rounded-md bg-[#2878FF]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 rounded-2xl bg-[#0E1629] border border-white/10 text-center"
            >
              <p className="text-base font-medium text-white">No projects in this category yet.</p>
              <p className="text-sm text-slate-400 mt-1">
                Select another category or add projects from the Admin Dashboard.
              </p>
            </motion.div>
          ) : (
            <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, idx) => (
                  <motion.article
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ y: -4 }}
                    transition={{
                      duration: 0.25,
                      delay: idx * 0.04,
                      ease: EASE_OUT,
                    }}
                    className="rounded-2xl bg-[#0E1629] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-white/25 transition-colors"
                  >
                    <div>
                      <div className="aspect-[4/3] w-full overflow-hidden bg-[#080D1A] border-b border-white/10">
                        <ResilientImage
                          src={project.imageUrl}
                          alt={`${project.title} preview`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.04]"
                          fallbackTitle={project.title}
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <span className="text-[#5B9BFF] font-medium">{project.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{project.isDemo ? 'Sample Demo Project' : project.clientType}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                        <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedProject(project)}
                        className="w-full py-2.5 px-4 rounded-lg bg-[#080D1A] hover:bg-[#131E36] border border-white/10 text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span>View Project</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================
          5. WHY CHOOSE WEBTREX?
      ========================================================= */}
      <section className="py-20 lg:py-28 border-b border-white/10 bg-[#0A1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="lg:col-span-5 lg:sticky lg:top-24"
            >
              <p className="text-sm font-medium text-[#5B9BFF] mb-3">Why Choose WebTrex</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                Engineering discipline paired with thoughtful design.
              </h2>
              <p className="mt-4 text-base text-slate-300 leading-relaxed">
                We partner closely with founders, teams, and organizations to ship software that
                remains fast, clear, and maintainable long after launch day.
              </p>
              <div className="mt-8">
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                  onClick={() => scrollToSection('#contact')}
                  className="px-5 py-3 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Discuss Your Scope</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerGrid}
              className="lg:col-span-7 divide-y divide-white/10 border-t border-b border-white/10"
            >
              {WHY_CHOOSE_ITEMS.map((item) => (
                <motion.div
                  key={item.number}
                  variants={staggerCard}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="py-6 sm:py-7 grid sm:grid-cols-12 gap-3 sm:gap-6 items-baseline"
                >
                  <span className="sm:col-span-2 font-mono-tabular text-sm font-medium text-[#5B9BFF]">
                    {item.number}
                  </span>
                  <div className="sm:col-span-10">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          6. OUR TEAM
      ========================================================= */}
      <section id="team" className="py-20 lg:py-28 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#5B9BFF] mb-3">Our Team</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                The specialists behind WebTrex.
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Team profiles, roles, bios, and social links are managed live through the WebTrex
              Admin Dashboard.
            </p>
          </motion.div>

          {teamMembers.length === 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerGrid}
              className="grid md:grid-cols-3 gap-6"
            >
              {CONFIGURABLE_TEAM_SLOTS.map((slot) => (
                <motion.div
                  key={slot.role}
                  variants={staggerCard}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="p-7 rounded-2xl bg-[#0E1629] border border-dashed border-white/15 hover:border-white/30 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="w-14 h-14 rounded-xl bg-[#080D1A] border border-white/10 flex items-center justify-center mb-5">
                      <UserPlus className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400 mb-1">Admin-Configurable Team Slot</p>
                    <h3 className="text-lg font-semibold text-white">{slot.role}</h3>
                    <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">{slot.focus}</p>
                  </div>
                  <p className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-500">
                    Sign in as an administrator to publish team member details and portraits.
                  </p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerGrid}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {teamMembers.map((member) => {
                const linkedin = sanitizeExternalUrl(member.linkedinUrl);
                const github = sanitizeExternalUrl(member.githubUrl);
                const xUrl = sanitizeExternalUrl(member.xUrl);
                const initials = member.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <motion.article
                    key={member.id}
                    variants={staggerCard}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    className="p-7 rounded-2xl bg-[#0E1629] border border-white/10 hover:border-white/25 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-5">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-[#16223D] border border-white/10 flex items-center justify-center text-base font-bold text-white shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {member.name}
                          </h3>
                          <p className="text-sm text-[#5B9BFF] truncate">{member.role}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{member.bio}</p>
                    </div>

                    {(linkedin || github || xUrl) && (
                      <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                        {linkedin && (
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} on LinkedIn`}
                            className="w-9 h-9 rounded-lg bg-[#080D1A] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {github && (
                          <a
                            href={github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} on GitHub`}
                            className="w-9 h-9 rounded-lg bg-[#080D1A] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {xUrl && (
                          <a
                            href={xUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} on X`}
                            className="w-9 h-9 rounded-lg bg-[#080D1A] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================
          7. CONTACT SECTION
      ========================================================= */}
      <section id="contact" className="py-20 lg:py-28 bg-[#0A1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Contact Info */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-[#5B9BFF] mb-3">Contact Us</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                  Let&apos;s Build Something Amazing.
                </h2>
                <p className="mt-4 text-base text-slate-300 leading-relaxed">
                  Share your goals, timeline, or technical questions. Every inquiry is saved to
                  our workspace for direct follow-up.
                </p>

                <div className="mt-10 space-y-5 border-t border-white/10 pt-8">
                  <div className="flex items-start gap-3.5">
                    <Mail className="w-5 h-5 text-[#2878FF] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="text-sm font-medium text-white mt-0.5">
                        {siteContent.contactEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <Phone className="w-5 h-5 text-[#2878FF] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-sm font-medium text-white mt-0.5">
                        {siteContent.contactPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-[#2878FF] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Studio Presence</p>
                      <p className="text-sm font-medium text-white mt-0.5">
                        {siteContent.contactLocation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <Clock className="w-5 h-5 text-[#2878FF] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Business Hours</p>
                      <p className="text-sm font-medium text-white mt-0.5">
                        {siteContent.businessHours}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-5 rounded-xl bg-[#0E1629] border border-white/10">
                <p className="text-sm font-semibold text-white">Direct Studio Response</p>
                <p className="text-xs text-slate-400 mt-1">
                  Every contact submission is logged directly for our engineering team to review.
                </p>
              </div>
            </div>

            {/* Right Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="lg:col-span-7"
            >
              <form
                onSubmit={handleContactSubmit}
                className="p-6 sm:p-8 rounded-2xl bg-[#0E1629] border border-white/10 space-y-5"
              >
                <AnimatePresence>
                  {contactError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-4 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-sm text-red-200"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{contactError}</span>
                    </motion.div>
                  )}

                  {contactSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-sm text-emerald-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{contactSuccess}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-fullname"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="contact-fullname"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2878FF] transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@organization.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2878FF] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-project-type"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Project Type
                    </label>
                    <select
                      id="contact-project-type"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white focus:outline-none focus:border-[#2878FF] transition-colors"
                    >
                      {PROJECT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-budget"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Budget (Optional)
                    </label>
                    <select
                      id="contact-budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white focus:outline-none focus:border-[#2878FF] transition-colors"
                    >
                      <option value="">Select estimated budget</option>
                      {BUDGET_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-details"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Project Details
                  </label>
                  <textarea
                    id="contact-details"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tell us about your website, web or Android app, design goals, and desired timeline..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2878FF] transition-colors resize-y"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="text-xs text-slate-500 font-mono-tabular">
                    {details.length}/2000
                  </span>
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={contactSubmitting}
                    className="px-6 py-3 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{contactSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          8. FOOTER
      ========================================================= */}
      <footer className="bg-[#060A14] border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            <div>
              <WebTrexLogo size={30} />
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Your Vision. Our Creation. Creative technology, web platforms, Android apps, and
                tailored digital development.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Navigation</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {[
                  { label: 'Home', id: '#home' },
                  { label: 'About', id: '#about' },
                  { label: 'Services', id: '#services' },
                  { label: 'Projects', id: '#projects' },
                  { label: 'Our Team', id: '#team' },
                  { label: 'Contact', id: '#contact' },
                ].map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.id}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(link.id);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {services.slice(0, 6).map((svc) => (
                  <li key={svc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedService(svc)}
                      className="hover:text-white transition-colors text-left cursor-pointer"
                    >
                      {svc.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>{siteContent.contactEmail}</li>
                <li>{siteContent.contactPhone}</li>
                <li>{siteContent.contactLocation}</li>
              </ul>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('#contact');
                  }}
                  aria-label="Contact WebTrex via Email"
                  className="w-9 h-9 rounded-lg bg-[#0E1629] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() =>
                    firebaseUser ? onNavigateView('admin-dashboard') : onOpenAuth()
                  }
                  aria-label="Admin Sign In"
                  className="w-9 h-9 rounded-lg bg-[#0E1629] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 WebTrex. All Rights Reserved.</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Terms and Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================
          SERVICE DETAIL MODAL
      ========================================================= */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="relative w-full max-w-lg bg-[#0E1629] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                aria-label="Close service details"
                className="absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-11 h-11 rounded-xl bg-[#2878FF]/10 border border-[#2878FF]/25 flex items-center justify-center mb-5">
                <ServiceIcon icon={selectedService.icon} className="w-5 h-5 text-[#2878FF]" />
              </div>
              <h3 id="service-modal-title" className="text-2xl font-bold text-white">
                {selectedService.title}
              </h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {selectedService.description}
              </p>

              {selectedService.deliverables.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <p className="text-xs font-semibold text-slate-300 mb-3">Key Deliverables</p>
                  <ul className="space-y-2.5">
                    {selectedService.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-[#2878FF] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2.5 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRequestWithService(selectedService.title)}
                  className="px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Request This Service</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          PROJECT DETAIL MODAL
      ========================================================= */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="relative w-full max-w-2xl bg-[#0E1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-auto"
            >
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project preview"
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-lg bg-[#080D1A]/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-[16/9] w-full bg-[#080D1A] border-b border-white/10">
                <ResilientImage
                  src={selectedProject.imageUrl}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                  fallbackTitle={selectedProject.title}
                />
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="text-[#5B9BFF] font-medium">{selectedProject.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {selectedProject.isDemo
                      ? 'Sample Demo Concept (Illustrative Showcase)'
                      : selectedProject.clientType}
                  </span>
                </div>

                <h3 id="project-modal-title" className="text-2xl font-bold text-white">
                  {selectedProject.title}
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  {selectedProject.description}
                </p>

                {selectedProject.highlights.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <p className="text-xs font-semibold text-slate-300 mb-3">Architecture &amp; Scope</p>
                    <ul className="space-y-2">
                      {selectedProject.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-[#2878FF] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                  {sanitizeExternalUrl(selectedProject.liveUrl) && (
                    <a
                      href={sanitizeExternalUrl(selectedProject.liveUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-lg border border-white/15 text-sm font-medium text-white hover:bg-white/5 inline-flex items-center gap-2"
                    >
                      <span>Visit Live Site</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedProject(null);
                      scrollToSection('#contact');
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Build Something Similar</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          PRIVACY / TERMS MODAL
      ========================================================= */}
      <AnimatePresence>
        {legalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="relative w-full max-w-lg bg-[#0E1629] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close legal notice"
                className="absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-3">
                {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
              </h3>
              <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
                {legalModal === 'privacy' ? (
                  <>
                    <p>
                      WebTrex collects only the information you explicitly submit through our contact
                      forms, account registration, and project request workflows (such as your name,
                      email address, company, and project scope).
                    </p>
                    <p>
                      Account profiles, project requests, and private messages are isolated to your
                      authenticated account and authorized WebTrex administrators. We never sell or
                      rent client data to third parties.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      By using the WebTrex website and client portal, you agree to provide accurate
                      project and contact information and to respect intellectual property across all
                      designs, codebases, and demo materials displayed here.
                    </p>
                    <p>
                      All formal project timelines, deliverables, and pricing are governed by written
                      project agreements approved between WebTrex and the client.
                    </p>
                  </>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
