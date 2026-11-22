import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  UserCheck,
  Mail,
  FileText,
  Globe,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Shield,
  Database,
  RefreshCw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  DEFAULT_PROJECTS,
  DEFAULT_SERVICES,
  DEFAULT_SITE_CONTENT,
} from '../data/defaults';
import type { PublicSiteData } from '../hooks/usePublicSiteData';
import type {
  AppView,
  ClientProject,
  ClientProjectPhase,
  ContactMessage,
  MessageStatus,
  PortfolioProject,
  ProjectCategory,
  ProjectRequest,
  RequestStatus,
  ServiceIconKey,
  ServiceItem,
  SiteContent,
  TeamMember,
  UserProfile,
} from '../types';
import { WebTrexLogo } from './WebTrexLogo';

type AdminTab =
  | 'overview'
  | 'users'
  | 'projects'
  | 'services'
  | 'team'
  | 'messages'
  | 'requests'
  | 'content'
  | 'analytics'
  | 'settings';

interface AdminDashboardProps {
  siteData: PublicSiteData;
  onNavigateView: (view: AppView) => void;
}

const SERVICE_ICONS: ServiceIconKey[] = [
  'globe',
  'smartphone',
  'layers',
  'shopping-bag',
  'cpu',
  'wrench',
  'code',
  'shield',
];

export function AdminDashboard({ siteData, onNavigateView }: AdminDashboardProps) {
  const { firebaseUser, isAdmin, resendVerification, refreshAuthUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Admin collections
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [allProjects, setAllProjects] = useState<PortfolioProject[]>([]);
  const [allTeam, setAllTeam] = useState<TeamMember[]>([]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Search/filters
  const [userSearch, setUserSearch] = useState('');
  const [msgFilter, setMsgFilter] = useState<'all' | MessageStatus>('all');
  const [projectSubTab, setProjectSubTab] = useState<'portfolio' | 'client'>('portfolio');

  // Content & Settings form
  const [contentForm, setContentForm] = useState<SiteContent>(siteData.siteContent);
  const [savingContent, setSavingContent] = useState(false);

  // Modals for CRUD
  const [serviceModal, setServiceModal] = useState<Partial<ServiceItem> | null>(null);
  const [serviceDeliverablesText, setServiceDeliverablesText] = useState('');

  const [portfolioModal, setPortfolioModal] = useState<Partial<PortfolioProject> | null>(null);
  const [portfolioHighlightsText, setPortfolioHighlightsText] = useState('');

  const [clientProjModal, setClientProjModal] = useState<Partial<ClientProject> | null>(null);

  const [teamModal, setTeamModal] = useState<Partial<TeamMember> | null>(null);

  const [requestEditor, setRequestEditor] = useState<ProjectRequest | null>(null);
  const [messageEditor, setMessageEditor] = useState<ContactMessage | null>(null);

  useEffect(() => {
    setContentForm(siteData.siteContent);
  }, [siteData.siteContent]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsersList(snap.docs.map((d) => d.data() as UserProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users'),
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        setAdminIds(new Set(snap.docs.map((d) => d.id)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'admins'),
    );

    const unsubRequests = onSnapshot(
      collection(db, 'project_requests'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectRequest));
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'project_requests'),
    );

    const unsubMessages = onSnapshot(
      collection(db, 'contact_messages'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactMessage));
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setMessages(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'contact_messages'),
    );

    const unsubClientProjects = onSnapshot(
      collection(db, 'client_projects'),
      (snap) => {
        setClientProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientProject)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'client_projects'),
    );

    const unsubServices = onSnapshot(
      query(collection(db, 'services'), orderBy('order', 'asc')),
      (snap) => {
        setAllServices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceItem)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'services'),
    );

    const unsubPortfolio = onSnapshot(
      query(collection(db, 'projects'), orderBy('order', 'asc')),
      (snap) => {
        setAllProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PortfolioProject)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects'),
    );

    const unsubTeam = onSnapshot(
      query(collection(db, 'team_members'), orderBy('order', 'asc')),
      (snap) => {
        setAllTeam(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'team_members'),
    );

    return () => {
      unsubUsers();
      unsubAdmins();
      unsubRequests();
      unsubMessages();
      unsubClientProjects();
      unsubServices();
      unsubPortfolio();
      unsubTeam();
    };
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q),
    );
  }, [usersList, userSearch]);

  const filteredMessages = useMemo(() => {
    if (msgFilter === 'all') return messages;
    return messages.filter((m) => m.status === msgFilter);
  }, [messages, msgFilter]);

  // Analytics derived metrics
  const analyticsData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      'in-review': 0,
      approved: 0,
      'in-progress': 0,
      completed: 0,
      declined: 0,
    };
    requests.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    const typeCounts: Record<string, number> = {};
    [...requests, ...messages].forEach((item) => {
      const key = item.projectType || 'Other';
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    });

    const portfolioSource = allProjects.length > 0 ? allProjects : siteData.projects;
    const categoryCounts: Record<string, number> = {
      Websites: 0,
      Applications: 0,
      'UI/UX': 0,
    };
    portfolioSource.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    return {
      statusCounts,
      typeEntries: Object.entries(typeCounts).sort((a, b) => b[1] - a[1]),
      categoryCounts,
    };
  }, [requests, messages, allProjects, siteData.projects]);

  if (!firebaseUser || !isAdmin) {
    const needsVerification = Boolean(firebaseUser && !firebaseUser.emailVerified);
    return (
      <div className="min-h-screen bg-[#080D1A] text-slate-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full p-8 rounded-2xl bg-[#0E1629] border border-white/10 text-center"
        >
          <Shield className="w-10 h-10 text-[#2878FF] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">
            {needsVerification
              ? 'Verify Administrator Email'
              : 'Administrator Access Required'}
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {needsVerification
              ? `Signed in as ${firebaseUser?.email}. Your Firebase email verification must be marked verified before accessing the Admin Panel database.`
              : 'Only authorized WebTrex administrators can access this Admin Panel.'}
          </p>
          {feedback && (
            <p className="mt-4 text-xs text-slate-200 bg-[#080D1A] border border-white/10 rounded-lg p-3">
              {feedback.text}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {needsVerification && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await resendVerification();
                      showToast('success', 'Verification email sent. Check your inbox.');
                    } catch {
                      showToast('error', 'Could not send verification email right now.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold cursor-pointer"
                >
                  Send Verification Email
                </button>
                <button
                  type="button"
                  onClick={() => refreshAuthUser()}
                  className="px-4 py-2.5 rounded-lg border border-white/15 text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Status</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={async () => {
                if (firebaseUser) await logout();
                onNavigateView('public');
              }}
              className="px-4 py-2.5 rounded-lg border border-white/15 text-slate-300 hover:text-white text-sm font-medium cursor-pointer"
            >
              {firebaseUser ? 'Sign Out & Return' : 'Return to Website'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
  };

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleToggleUserStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      showToast('success', `${user.displayName} marked as ${nextStatus}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleToggleUserAdmin = async (user: UserProfile) => {
    const currentlyAdmin = adminIds.has(user.uid);
    try {
      if (currentlyAdmin) {
        await deleteDoc(doc(db, 'admins', user.uid));
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'client',
          updatedAt: serverTimestamp(),
        });
        showToast('success', `Revoked admin privileges for ${user.email}.`);
      } else {
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: user.email,
          grantedBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'admin',
          updatedAt: serverTimestamp(),
        });
        showToast('success', `Granted admin privileges to ${user.email}.`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${user.uid}`);
    }
  };

  const handleSeedDefaults = async (target: 'services' | 'projects' | 'content') => {
    try {
      if (target === 'services') {
        for (const s of DEFAULT_SERVICES) {
          await setDoc(doc(db, 'services', s.id), {
            title: s.title,
            description: s.description,
            icon: s.icon,
            deliverables: s.deliverables,
            order: s.order,
            active: s.active,
            updatedAt: serverTimestamp(),
          });
        }
        showToast('success', 'Default WebTrex services seeded to Firestore.');
      } else if (target === 'projects') {
        for (const p of DEFAULT_PROJECTS) {
          await setDoc(doc(db, 'projects', p.id), {
            title: p.title,
            category: p.category,
            description: p.description,
            clientType: p.clientType,
            isDemo: p.isDemo,
            imageUrl: p.imageUrl,
            highlights: p.highlights,
            liveUrl: '',
            order: p.order,
            updatedAt: serverTimestamp(),
          });
        }
        showToast('success', 'Default demo showcase projects seeded to Firestore.');
      } else {
        await setDoc(doc(db, 'site_content', 'main'), {
          ...DEFAULT_SITE_CONTENT,
          updatedAt: serverTimestamp(),
        });
        showToast('success', 'Site content initialized in Firestore.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, target);
    }
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    try {
      await setDoc(doc(db, 'site_content', 'main'), {
        heroHeadline: contentForm.heroHeadline.trim().slice(0, 180),
        heroDescription: contentForm.heroDescription.trim().slice(0, 400),
        aboutHeadline: contentForm.aboutHeadline.trim().slice(0, 180),
        aboutDescription: contentForm.aboutDescription.trim().slice(0, 600),
        mission: contentForm.mission.trim().slice(0, 400),
        vision: contentForm.vision.trim().slice(0, 400),
        values: contentForm.values.trim().slice(0, 400),
        contactEmail: contentForm.contactEmail.trim().slice(0, 150),
        contactPhone: contentForm.contactPhone.trim().slice(0, 60),
        contactLocation: contentForm.contactLocation.trim().slice(0, 150),
        businessHours: contentForm.businessHours.trim().slice(0, 120),
        updatedAt: serverTimestamp(),
      });
      showToast('success', 'Website content and settings published.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'site_content/main');
    } finally {
      setSavingContent(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModal) return;
    const deliverables = serviceDeliverablesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);

    const payload = {
      title: (serviceModal.title || '').trim().slice(0, 100),
      description: (serviceModal.description || '').trim().slice(0, 500),
      icon: (serviceModal.icon || 'globe') as ServiceIconKey,
      deliverables,
      order: Number(serviceModal.order ?? allServices.length + 1),
      active: serviceModal.active !== false,
      updatedAt: serverTimestamp(),
    };

    try {
      if (serviceModal.id) {
        await setDoc(doc(db, 'services', serviceModal.id), payload);
        showToast('success', 'Service updated.');
      } else {
        await addDoc(collection(db, 'services'), payload);
        showToast('success', 'Service added.');
      }
      setServiceModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'services');
    }
  };

  const handleSavePortfolioProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioModal) return;
    const highlights = portfolioHighlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    const payload = {
      title: (portfolioModal.title || '').trim().slice(0, 120),
      category: (portfolioModal.category || 'Websites') as ProjectCategory,
      description: (portfolioModal.description || '').trim().slice(0, 600),
      clientType: (portfolioModal.clientType || 'Client Launch').trim().slice(0, 100),
      isDemo: Boolean(portfolioModal.isDemo),
      imageUrl: (portfolioModal.imageUrl || '').trim().slice(0, 500),
      highlights,
      liveUrl: (portfolioModal.liveUrl || '').trim().slice(0, 300),
      order: Number(portfolioModal.order ?? allProjects.length + 1),
      updatedAt: serverTimestamp(),
    };

    try {
      if (portfolioModal.id) {
        await setDoc(doc(db, 'projects', portfolioModal.id), payload);
        showToast('success', 'Portfolio project updated.');
      } else {
        await addDoc(collection(db, 'projects'), payload);
        showToast('success', 'Portfolio project created.');
      }
      setPortfolioModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'projects');
    }
  };

  const handleSaveClientProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientProjModal) return;
    const payload = {
      userId: (clientProjModal.userId || '').trim(),
      userEmail: (clientProjModal.userEmail || '').trim().slice(0, 254),
      name: (clientProjModal.name || '').trim().slice(0, 140),
      category: (clientProjModal.category || 'Website Development').trim().slice(0, 80),
      phase: (clientProjModal.phase || 'Discovery') as ClientProjectPhase,
      progress: Math.min(100, Math.max(0, Number(clientProjModal.progress ?? 0))),
      nextMilestone: (clientProjModal.nextMilestone || '').trim().slice(0, 200),
      previewUrl: (clientProjModal.previewUrl || '').trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    };

    try {
      if (clientProjModal.id) {
        await updateDoc(doc(db, 'client_projects', clientProjModal.id), payload);
        showToast('success', 'Client project updated.');
      } else {
        await addDoc(collection(db, 'client_projects'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showToast('success', 'Client project assigned.');
      }
      setClientProjModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'client_projects');
    }
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamModal) return;
    const payload = {
      name: (teamModal.name || '').trim().slice(0, 100),
      role: (teamModal.role || '').trim().slice(0, 100),
      bio: (teamModal.bio || '').trim().slice(0, 400),
      photoUrl: (teamModal.photoUrl || '').trim().slice(0, 500),
      linkedinUrl: (teamModal.linkedinUrl || '').trim().slice(0, 300),
      githubUrl: (teamModal.githubUrl || '').trim().slice(0, 300),
      xUrl: (teamModal.xUrl || '').trim().slice(0, 300),
      order: Number(teamModal.order ?? allTeam.length + 1),
      updatedAt: serverTimestamp(),
    };

    try {
      if (teamModal.id) {
        await setDoc(doc(db, 'team_members', teamModal.id), payload);
        showToast('success', 'Team member updated.');
      } else {
        await addDoc(collection(db, 'team_members'), payload);
        showToast('success', 'Team member added.');
      }
      setTeamModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'team_members');
    }
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEditor) return;
    try {
      await updateDoc(doc(db, 'project_requests', requestEditor.id), {
        status: requestEditor.status,
        progress: Math.min(100, Math.max(0, Number(requestEditor.progress))),
        adminNotes: requestEditor.adminNotes.trim().slice(0, 1000),
        updatedAt: serverTimestamp(),
      });
      showToast('success', 'Project request status updated.');
      setRequestEditor(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `project_requests/${requestEditor.id}`);
    }
  };

  const handlePromoteRequestToProject = async (req: ProjectRequest) => {
    try {
      await addDoc(collection(db, 'client_projects'), {
        userId: req.userId,
        userEmail: req.userEmail,
        name: req.title,
        category: req.projectType,
        phase: 'Discovery',
        progress: 10,
        nextMilestone: 'Kickoff & Technical Architecture Review',
        previewUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'project_requests', req.id), {
        status: 'in-progress',
        progress: 10,
        updatedAt: serverTimestamp(),
      });
      showToast('success', `Promoted "${req.title}" to an active client project.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'client_projects');
    }
  };

  const handleUpdateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageEditor) return;
    try {
      await updateDoc(doc(db, 'contact_messages', messageEditor.id), {
        status: messageEditor.status,
        replyMessage: messageEditor.replyMessage.trim().slice(0, 2000),
        updatedAt: serverTimestamp(),
      });
      showToast('success', 'Message updated.');
      setMessageEditor(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contact_messages/${messageEditor.id}`);
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: 'Manage Users', icon: <Users className="w-4 h-4" /> },
    { id: 'projects', label: 'Manage Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'services', label: 'Manage Services', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'team', label: 'Manage Team', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'messages', label: 'Contact Messages', icon: <Mail className="w-4 h-4" /> },
    { id: 'requests', label: 'Project Requests', icon: <FileText className="w-4 h-4" /> },
    { id: 'content', label: 'Website Content', icon: <Globe className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const activeLabel = navItems.find((n) => n.id === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-[#080D1A] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-white/10 bg-[#0A1020] shrink-0">
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
          <button
            type="button"
            onClick={() => onNavigateView('public')}
            className="cursor-pointer"
          >
            <WebTrexLogo size={28} />
          </button>
          <span className="text-[11px] font-medium text-[#5B9BFF]">Admin</span>
        </div>

        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setFeedback(null);
                }}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="adminActiveTab"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[#2878FF]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-3 min-w-0">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-white/10 space-y-1">
          <button
            type="button"
            onClick={() => onNavigateView('public')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Website</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              onNavigateView('public');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-8 border-b border-white/10 bg-[#080D1A]/90 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden w-10 h-10 rounded-lg border border-white/10 bg-[#0E1629] flex items-center justify-center text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-500 hidden sm:inline">Admin Console</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="font-semibold text-white truncate">{activeLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateView('public')}
            className="px-3.5 py-2 rounded-lg border border-white/10 bg-[#0E1629] hover:bg-[#141F38] text-xs sm:text-sm font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            View Live Site
          </button>
        </header>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/70"
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-72 max-w-[85vw] bg-[#0A1020] border-r border-white/10 flex flex-col h-full z-10"
              >
                <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
                  <WebTrexLogo size={26} />
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === item.id ? 'bg-[#2878FF] text-white' : 'text-slate-400'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                key={feedback.text}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                    : 'bg-red-500/10 border-red-500/25 text-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
          {/* =====================================================
              1. OVERVIEW
          ===================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    WebTrex Operations Overview
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Signed in as {firebaseUser.email}
                  </p>
                </div>
                {(allServices.length === 0 || allProjects.length === 0) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (allServices.length === 0) await handleSeedDefaults('services');
                      if (allProjects.length === 0) await handleSeedDefaults('projects');
                      await handleSeedDefaults('content');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    <span>Sync Default Catalog to Database</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Registered Users', value: usersList.length, accent: false },
                  { label: 'Project Requests', value: requests.length, accent: false },
                  {
                    label: 'Unread Contact Inquiries',
                    value: messages.filter((m) => m.status === 'new').length,
                    accent: true,
                  },
                  { label: 'Active Client Builds', value: clientProjects.length, accent: false },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.24,
                      delay: idx * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ y: -2 }}
                    className="p-5 rounded-2xl bg-[#0E1629] border border-white/10 hover:border-[#2878FF]/35 transition-colors"
                  >
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p
                      className={`mt-2 text-3xl font-bold font-mono-tabular ${
                        stat.accent ? 'text-[#5B9BFF]' : 'text-white'
                      }`}
                    >
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0E1629] border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white">Latest Project Requests</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('requests')}
                      className="text-xs text-[#5B9BFF] hover:text-white cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                  {requests.length === 0 ? (
                    <p className="text-sm text-slate-400 py-6 text-center">
                      No project requests submitted yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {requests.slice(0, 5).map((r) => (
                        <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{r.title}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {r.userName} · {r.projectType}
                            </p>
                          </div>
                          <span className="text-xs text-slate-300 capitalize">{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-[#0E1629] border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white">Latest Contact Messages</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('messages')}
                      className="text-xs text-[#5B9BFF] hover:text-white cursor-pointer"
                    >
                      Open Inbox
                    </button>
                  </div>
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-400 py-6 text-center">
                      No contact messages received yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {messages.slice(0, 5).map((m) => (
                        <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{m.fullName}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {m.email} · {m.projectType}
                            </p>
                          </div>
                          <span className="text-xs text-[#5B9BFF] capitalize">{m.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              2. MANAGE USERS
          ===================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Manage Users</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Review client accounts, suspend access, or assign administrator permissions.
                  </p>
                </div>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="px-3.5 py-2 rounded-lg bg-[#0E1629] border border-white/10 text-sm text-white w-full sm:w-64"
                />
              </div>

              <div className="rounded-2xl bg-[#0E1629] border border-white/10 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400">
                      <th className="py-3.5 px-5 font-medium">User</th>
                      <th className="py-3.5 px-5 font-medium">Company</th>
                      <th className="py-3.5 px-5 font-medium">Role</th>
                      <th className="py-3.5 px-5 font-medium">Status</th>
                      <th className="py-3.5 px-5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No matching user accounts found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isTargetAdmin = adminIds.has(u.uid) || u.role === 'admin';
                        return (
                          <tr key={u.uid} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-5">
                              <p className="font-medium text-white">{u.displayName}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </td>
                            <td className="py-3.5 px-5 text-slate-300">{u.company || '—'}</td>
                            <td className="py-3.5 px-5 text-slate-300 capitalize">
                              {isTargetAdmin ? 'Admin' : 'Client'}
                            </td>
                            <td className="py-3.5 px-5">
                              <span
                                className={`text-xs font-medium ${
                                  u.status === 'active' ? 'text-emerald-300' : 'text-red-300'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleUserAdmin(u)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 hover:bg-white/5 cursor-pointer"
                              >
                                {adminIds.has(u.uid) ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 hover:bg-white/5 cursor-pointer"
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =====================================================
              3. MANAGE PROJECTS (Portfolio + Client Builds)
          ===================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Manage Projects</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Curate public portfolio projects and track active client delivery projects.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex p-1 rounded-lg bg-[#0E1629] border border-white/10">
                    {(['portfolio', 'client'] as const).map((sub) => {
                      const active = projectSubTab === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setProjectSubTab(sub)}
                          className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                            active ? 'text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="adminProjectsSubTab"
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              className="absolute inset-0 rounded-md bg-[#2878FF]"
                            />
                          )}
                          <span className="relative z-10">
                            {sub === 'portfolio' ? 'Public Portfolio' : 'Client Projects'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {projectSubTab === 'portfolio' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {allProjects.length === 0 && (
                      <button
                        type="button"
                        onClick={() => handleSeedDefaults('projects')}
                        className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
                      >
                        Seed Default Demo Showcase
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPortfolioHighlightsText('');
                        setPortfolioModal({
                          title: '',
                          category: 'Websites',
                          description: '',
                          clientType: '',
                          isDemo: false,
                          imageUrl: '/src/assets/images/project_fintech_web_1795273670151.jpg',
                          liveUrl: '',
                          order: allProjects.length + 1,
                        });
                      }}
                      className="px-4 py-2 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 ml-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Portfolio Project</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {allProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl bg-[#0E1629] border border-white/10 flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs text-[#5B9BFF] mb-1">
                            {p.category} · {p.isDemo ? 'Demo' : p.clientType}
                          </div>
                          <h3 className="text-base font-semibold text-white">{p.title}</h3>
                          <p className="text-xs text-slate-400 mt-1.5 line-clamp-3">
                            {p.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              setPortfolioHighlightsText((p.highlights || []).join('\n'));
                              setPortfolioModal(p);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 hover:bg-white/5 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteDoc(doc(db, 'projects', p.id));
                              showToast('success', 'Project removed.');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-red-300 hover:bg-red-500/10 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setClientProjModal({
                          userId: usersList[0]?.uid || '',
                          userEmail: usersList[0]?.email || '',
                          name: '',
                          category: 'Website Development',
                          phase: 'Discovery',
                          progress: 15,
                          nextMilestone: '',
                          previewUrl: '',
                        })
                      }
                      className="px-4 py-2 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Assign Client Project</span>
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#0E1629] border border-white/10 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs text-slate-400">
                          <th className="py-3.5 px-5 font-medium">Project</th>
                          <th className="py-3.5 px-5 font-medium">Client</th>
                          <th className="py-3.5 px-5 font-medium">Phase</th>
                          <th className="py-3.5 px-5 font-medium">Progress</th>
                          <th className="py-3.5 px-5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-sm">
                        {clientProjects.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-400">
                              No active client delivery projects yet.
                            </td>
                          </tr>
                        ) : (
                          clientProjects.map((cp) => (
                            <tr key={cp.id}>
                              <td className="py-3.5 px-5 font-medium text-white">{cp.name}</td>
                              <td className="py-3.5 px-5 text-slate-300">{cp.userEmail}</td>
                              <td className="py-3.5 px-5 text-slate-300">{cp.phase}</td>
                              <td className="py-3.5 px-5 font-mono-tabular text-[#5B9BFF]">
                                {cp.progress}%
                              </td>
                              <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setClientProjModal(cp)}
                                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteDoc(doc(db, 'client_projects', cp.id));
                                    showToast('success', 'Client project deleted.');
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-red-300 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              4. MANAGE SERVICES
          ===================================================== */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Manage Services</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Add, update, or reorder services published on the WebTrex homepage.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {allServices.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleSeedDefaults('services')}
                      className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 cursor-pointer"
                    >
                      Seed Default Services
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setServiceDeliverablesText('');
                      setServiceModal({
                        title: '',
                        description: '',
                        icon: 'globe',
                        order: allServices.length + 1,
                        active: true,
                      });
                    }}
                    className="px-4 py-2 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Service</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-5 rounded-2xl bg-[#0E1629] border border-white/10 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-mono-tabular">Order #{svc.order}</span>
                        <span>{svc.active ? 'Published' : 'Hidden'}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white">{svc.title}</h3>
                      <p className="text-xs text-slate-400 mt-1.5">{svc.description}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setServiceDeliverablesText((svc.deliverables || []).join('\n'));
                          setServiceModal(svc);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDoc(doc(db, 'services', svc.id));
                          showToast('success', 'Service deleted.');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-red-300 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================
              5. MANAGE TEAM MEMBERS
          ===================================================== */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Manage Team Members
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Publish verified team member profiles, photos, bios, and social links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTeamModal({
                      name: '',
                      role: '',
                      bio: '',
                      photoUrl: '',
                      linkedinUrl: '',
                      githubUrl: '',
                      xUrl: '',
                      order: allTeam.length + 1,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Team Member</span>
                </button>
              </div>

              {allTeam.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#0E1629] border border-white/10 text-center">
                  <p className="text-base font-medium text-white">No team members added yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Add your real team profiles here to populate the public Our Team section.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allTeam.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-[#0E1629] border border-white/10 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs text-[#5B9BFF]">{m.role}</p>
                        <h3 className="text-base font-semibold text-white mt-0.5">{m.name}</h3>
                        <p className="text-xs text-slate-400 mt-2">{m.bio}</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setTeamModal(m)}
                          className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteDoc(doc(db, 'team_members', m.id));
                            showToast('success', 'Team member removed.');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-red-300 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              6. CONTACT MESSAGES
          ===================================================== */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Contact Messages</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Review inquiries from the public contact form and respond to client threads.
                  </p>
                </div>
                <select
                  value={msgFilter}
                  onChange={(e) => setMsgFilter(e.target.value as 'all' | MessageStatus)}
                  className="px-3.5 py-2 rounded-lg bg-[#0E1629] border border-white/10 text-sm text-white"
                >
                  <option value="all">All Messages</option>
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0E1629] border border-white/10 text-center text-sm text-slate-400">
                  No messages match this filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((m) => (
                    <div
                      key={m.id}
                      className="p-6 rounded-2xl bg-[#0E1629] border border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            {m.fullName} · <span className="text-slate-400 font-normal">{m.email}</span>
                          </h3>
                          <p className="text-xs text-[#5B9BFF] mt-0.5">
                            {m.projectType} · {m.budget || 'Budget not specified'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs capitalize text-slate-300 mr-2">{m.status}</span>
                          <button
                            type="button"
                            onClick={() => setMessageEditor(m)}
                            className="px-3 py-1.5 rounded-lg bg-[#2878FF] text-white text-xs font-medium cursor-pointer"
                          >
                            Reply / Update
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteDoc(doc(db, 'contact_messages', m.id));
                              showToast('success', 'Message deleted.');
                            }}
                            aria-label="Delete message"
                            className="p-2 rounded-lg border border-white/10 text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-line">{m.details}</p>
                      {m.replyMessage && (
                        <div className="p-3.5 rounded-lg bg-[#080D1A] border border-white/10 text-xs text-slate-300">
                          <span className="font-semibold text-[#5B9BFF]">Admin Reply: </span>
                          {m.replyMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              7. MANAGE PROJECT REQUESTS
          ===================================================== */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Manage Project Requests
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Update request status, share team notes, and promote approved requests into active
                  projects.
                </p>
              </div>

              {requests.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0E1629] border border-white/10 text-center text-sm text-slate-400">
                  No project requests submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="p-6 rounded-2xl bg-[#0E1629] border border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            {r.userName} ({r.userEmail}) · {r.projectType} · {r.budget}
                          </p>
                          <h3 className="text-lg font-semibold text-white mt-0.5">{r.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono-tabular text-slate-300 mr-2">
                            {r.status} ({r.progress}%)
                          </span>
                          <button
                            type="button"
                            onClick={() => setRequestEditor(r)}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white hover:bg-white/5 inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromoteRequestToProject(r)}
                            className="px-3 py-1.5 rounded-lg bg-[#2878FF] text-white text-xs font-medium cursor-pointer"
                          >
                            Promote to Active Project
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteDoc(doc(db, 'project_requests', r.id));
                              showToast('success', 'Request deleted.');
                            }}
                            aria-label="Delete request"
                            className="p-2 rounded-lg border border-white/10 text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-line">{r.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              8. WEBSITE CONTENT MANAGEMENT
          ===================================================== */}
          {activeTab === 'content' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Website Content Management
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Edit the hero headline, description, and About WebTrex messaging live.
                </p>
              </div>

              <form
                onSubmit={handleSaveSiteContent}
                className="p-6 rounded-2xl bg-[#0E1629] border border-white/10 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={180}
                    value={contentForm.heroHeadline}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, heroHeadline: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Hero Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    maxLength={400}
                    value={contentForm.heroDescription}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, heroDescription: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    About Headline
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={180}
                    value={contentForm.aboutHeadline}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, aboutHeadline: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    About Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={600}
                    value={contentForm.aboutDescription}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, aboutDescription: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Our Mission
                  </label>
                  <textarea
                    rows={2}
                    required
                    maxLength={400}
                    value={contentForm.mission}
                    onChange={(e) => setContentForm({ ...contentForm, mission: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Our Vision
                  </label>
                  <textarea
                    rows={2}
                    required
                    maxLength={400}
                    value={contentForm.vision}
                    onChange={(e) => setContentForm({ ...contentForm, vision: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Our Values
                  </label>
                  <textarea
                    rows={2}
                    required
                    maxLength={400}
                    value={contentForm.values}
                    onChange={(e) => setContentForm({ ...contentForm, values: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingContent}
                    className="px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold cursor-pointer"
                  >
                    {savingContent ? 'Publishing...' : 'Publish Content Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =====================================================
              9. ANALYTICS
          ===================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Real-time operational distributions calculated from live Firestore records.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0E1629] border border-white/10 space-y-4">
                  <h2 className="text-base font-semibold text-white">
                    Project Requests by Status
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.statusCounts).map(([status, count]) => {
                      const pct = requests.length > 0 ? Math.round((count / requests.length) * 100) : 0;
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 capitalize">{status}</span>
                            <span className="font-mono-tabular text-slate-400">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[#080D1A] overflow-hidden">
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full bg-[#2878FF] rounded-full origin-left"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0E1629] border border-white/10 space-y-4">
                  <h2 className="text-base font-semibold text-white">
                    Demand by Service Category
                  </h2>
                  {analyticsData.typeEntries.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">
                      Inquiry distribution will populate as requests and messages arrive.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.typeEntries.map(([label, count]) => {
                        const total = requests.length + messages.length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300">{label}</span>
                              <span className="font-mono-tabular text-slate-400">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[#080D1A] overflow-hidden">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full bg-[#5B9BFF] rounded-full origin-left"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              10. SETTINGS
          ===================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Company Settings</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Configure company contact information displayed in the Contact section and Footer.
                </p>
              </div>

              <form
                onSubmit={handleSaveSiteContent}
                className="p-6 rounded-2xl bg-[#0E1629] border border-white/10 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Public Contact Email
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={contentForm.contactEmail}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, contactEmail: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={contentForm.contactPhone}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, contactPhone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Studio Location
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={contentForm.contactLocation}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, contactLocation: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Business Hours
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={contentForm.businessHours}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, businessHours: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingContent}
                    className="px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-semibold cursor-pointer"
                  >
                    {savingContent ? 'Saving...' : 'Save Contact Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================================
          MODALS
      ========================================================= */}
      <AnimatePresence>
        {serviceModal && (
          <motion.div
            key="service-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
          >
            <motion.form
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSaveService}
              className="w-full max-w-lg bg-[#0E1629] border border-white/10 rounded-2xl p-6 space-y-4 my-auto"
            >
            <h2 className="text-lg font-bold text-white">
              {serviceModal.id ? 'Edit Service' : 'Add Service'}
            </h2>
            <input
              type="text"
              required
              placeholder="Service Title"
              value={serviceModal.title || ''}
              onChange={(e) => setServiceModal({ ...serviceModal, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <textarea
              required
              rows={3}
              placeholder="Description"
              value={serviceModal.description || ''}
              onChange={(e) => setServiceModal({ ...serviceModal, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={serviceModal.icon || 'globe'}
                onChange={(e) =>
                  setServiceModal({ ...serviceModal, icon: e.target.value as ServiceIconKey })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              >
                {SERVICE_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    Icon: {ic}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={1000}
                value={serviceModal.order ?? 1}
                onChange={(e) =>
                  setServiceModal({ ...serviceModal, order: Number(e.target.value) })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              />
            </div>
            <textarea
              rows={3}
              placeholder="Deliverables (one per line)"
              value={serviceDeliverablesText}
              onChange={(e) => setServiceDeliverablesText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setServiceModal(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2878FF] text-white text-sm font-semibold cursor-pointer"
              >
                Save Service
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}

        {portfolioModal && (
          <motion.div
            key="portfolio-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
          >
            <motion.form
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSavePortfolioProject}
              className="w-full max-w-lg bg-[#0E1629] border border-white/10 rounded-2xl p-6 space-y-4 my-auto"
            >
            <h2 className="text-lg font-bold text-white">
              {portfolioModal.id ? 'Edit Portfolio Project' : 'Add Portfolio Project'}
            </h2>
            <input
              type="text"
              required
              placeholder="Project Name"
              value={portfolioModal.title || ''}
              onChange={(e) => setPortfolioModal({ ...portfolioModal, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={portfolioModal.category || 'Websites'}
                onChange={(e) =>
                  setPortfolioModal({
                    ...portfolioModal,
                    category: e.target.value as ProjectCategory,
                  })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              >
                <option value="Websites">Websites</option>
                <option value="Applications">Applications</option>
                <option value="UI/UX">UI/UX</option>
              </select>
              <input
                type="text"
                placeholder="Client / Concept Label"
                value={portfolioModal.clientType || ''}
                onChange={(e) =>
                  setPortfolioModal({ ...portfolioModal, clientType: e.target.value })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              />
            </div>
            <textarea
              required
              rows={3}
              placeholder="Short Description"
              value={portfolioModal.description || ''}
              onChange={(e) =>
                setPortfolioModal({ ...portfolioModal, description: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Preview Image URL"
              value={portfolioModal.imageUrl || ''}
              onChange={(e) => setPortfolioModal({ ...portfolioModal, imageUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Live URL (Optional, https://...)"
              value={portfolioModal.liveUrl || ''}
              onChange={(e) => setPortfolioModal({ ...portfolioModal, liveUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <textarea
              rows={3}
              placeholder="Highlights (one per line)"
              value={portfolioHighlightsText}
              onChange={(e) => setPortfolioHighlightsText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(portfolioModal.isDemo)}
                onChange={(e) =>
                  setPortfolioModal({ ...portfolioModal, isDemo: e.target.checked })
                }
              />
              <span>Label as Sample / Demo Project</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPortfolioModal(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2878FF] text-white text-sm font-semibold cursor-pointer"
              >
                Save Project
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}

        {clientProjModal && (
          <motion.div
            key="client-project-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
          >
            <motion.form
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSaveClientProject}
              className="w-full max-w-lg bg-[#0E1629] border border-white/10 rounded-2xl p-6 space-y-4 my-auto"
            >
            <h2 className="text-lg font-bold text-white">
              {clientProjModal.id ? 'Update Client Project' : 'Assign Client Project'}
            </h2>
            <select
              required
              value={clientProjModal.userId || ''}
              onChange={(e) => {
                const selected = usersList.find((u) => u.uid === e.target.value);
                setClientProjModal({
                  ...clientProjModal,
                  userId: e.target.value,
                  userEmail: selected?.email || '',
                });
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            >
              <option value="">Select client user</option>
              {usersList.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName} ({u.email})
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Project Name"
              value={clientProjModal.name || ''}
              onChange={(e) => setClientProjModal({ ...clientProjModal, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={clientProjModal.phase || 'Discovery'}
                onChange={(e) =>
                  setClientProjModal({
                    ...clientProjModal,
                    phase: e.target.value as ClientProjectPhase,
                  })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              >
                <option value="Discovery">Discovery</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Launched">Launched</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Progress %"
                value={clientProjModal.progress ?? 0}
                onChange={(e) =>
                  setClientProjModal({ ...clientProjModal, progress: Number(e.target.value) })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              />
            </div>
            <input
              type="text"
              placeholder="Next Milestone"
              value={clientProjModal.nextMilestone || ''}
              onChange={(e) =>
                setClientProjModal({ ...clientProjModal, nextMilestone: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Staging Preview URL (Optional)"
              value={clientProjModal.previewUrl || ''}
              onChange={(e) =>
                setClientProjModal({ ...clientProjModal, previewUrl: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClientProjModal(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2878FF] text-white text-sm font-semibold cursor-pointer"
              >
                Save Client Project
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}

        {teamModal && (
          <motion.div
            key="team-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
          >
            <motion.form
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSaveTeamMember}
              className="w-full max-w-lg bg-[#0E1629] border border-white/10 rounded-2xl p-6 space-y-4 my-auto"
            >
            <h2 className="text-lg font-bold text-white">
              {teamModal.id ? 'Edit Team Member' : 'Add Team Member'}
            </h2>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={teamModal.name || ''}
              onChange={(e) => setTeamModal({ ...teamModal, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <input
              type="text"
              required
              placeholder="Role (e.g., Lead Full-Stack Engineer)"
              value={teamModal.role || ''}
              onChange={(e) => setTeamModal({ ...teamModal, role: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <textarea
              required
              rows={3}
              placeholder="Short Introduction"
              value={teamModal.bio || ''}
              onChange={(e) => setTeamModal({ ...teamModal, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Profile Photo URL (Optional — uses initials if blank)"
              value={teamModal.photoUrl || ''}
              onChange={(e) => setTeamModal({ ...teamModal, photoUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="LinkedIn URL"
                value={teamModal.linkedinUrl || ''}
                onChange={(e) => setTeamModal({ ...teamModal, linkedinUrl: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#080D1A] border border-white/10 text-xs text-white"
              />
              <input
                type="text"
                placeholder="GitHub URL"
                value={teamModal.githubUrl || ''}
                onChange={(e) => setTeamModal({ ...teamModal, githubUrl: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#080D1A] border border-white/10 text-xs text-white"
              />
              <input
                type="text"
                placeholder="X URL"
                value={teamModal.xUrl || ''}
                onChange={(e) => setTeamModal({ ...teamModal, xUrl: e.target.value })}
                className="px-3 py-2 rounded-lg bg-[#080D1A] border border-white/10 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTeamModal(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2878FF] text-white text-sm font-semibold cursor-pointer"
              >
                Save Team Member
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}

        {requestEditor && (
          <motion.div
            key="request-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.form
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleUpdateRequest}
              className="w-full max-w-md bg-[#0E1629] border border-white/10 rounded-2xl p-6 space-y-4"
            >
            <h2 className="text-lg font-bold text-white">Update Project Request</h2>
            <p className="text-xs text-slate-400">{requestEditor.title}</p>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={requestEditor.status}
                onChange={(e) =>
                  setRequestEditor({ ...requestEditor, status: e.target.value as RequestStatus })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              >
                <option value="pending">Pending</option>
                <option value="in-review">In Review</option>
                <option value="approved">Approved</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                value={requestEditor.progress}
                onChange={(e) =>
                  setRequestEditor({ ...requestEditor, progress: Number(e.target.value) })
                }
                className="px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
              />
            </div>
            <textarea
              rows={3}
              placeholder="Admin response notes visible to client..."
              value={requestEditor.adminNotes}
              onChange={(e) => setRequestEditor({ ...requestEditor, adminNotes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestEditor(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2878FF] text-white text-sm font-semibold cursor-pointer"
              >
                Save Update
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}

        {messageEditor && (
          <motion.div
            key="message-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.form
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleUpdateMessage}
              className="w-full max-w-md bg-[#0E1629] border border-white/10 rounded-2xl p-6 space-y-4"
            >
            <h2 className="text-lg font-bold text-white">Respond to Inquiry</h2>
            <p className="text-xs text-slate-400">
              From {messageEditor.fullName} ({messageEditor.email})
            </p>
            <select
              value={messageEditor.status}
              onChange={(e) =>
                setMessageEditor({ ...messageEditor, status: e.target.value as MessageStatus })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            >
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
            <textarea
              rows={4}
              placeholder="Write reply note (visible in client portal if sent while signed in)..."
              value={messageEditor.replyMessage}
              onChange={(e) =>
                setMessageEditor({ ...messageEditor, replyMessage: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMessageEditor(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2878FF] text-white text-sm font-semibold cursor-pointer"
              >
                Save Response
              </button>
            </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
