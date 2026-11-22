import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  DEFAULT_PROJECTS,
  DEFAULT_SERVICES,
  DEFAULT_SITE_CONTENT,
} from '../data/defaults';
import type {
  PortfolioProject,
  ServiceItem,
  SiteContent,
  TeamMember,
} from '../types';

export interface PublicSiteData {
  siteContent: SiteContent;
  services: ServiceItem[];
  projects: PortfolioProject[];
  teamMembers: TeamMember[];
  loading: boolean;
  hasCustomServices: boolean;
  hasCustomProjects: boolean;
}

export function usePublicSiteData(): PublicSiteData {
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [projects, setProjects] = useState<PortfolioProject[]>(DEFAULT_PROJECTS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [hasCustomServices, setHasCustomServices] = useState(false);
  const [hasCustomProjects, setHasCustomProjects] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSite = onSnapshot(
      doc(db, 'site_content', 'main'),
      (snap) => {
        if (snap.exists()) {
          setSiteContent({ ...DEFAULT_SITE_CONTENT, ...(snap.data() as Partial<SiteContent>) });
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    const unsubServices = onSnapshot(
      query(collection(db, 'services'), orderBy('order', 'asc')),
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceItem));
          setServices(items.filter((s) => s.active !== false));
          setHasCustomServices(true);
        } else {
          setServices(DEFAULT_SERVICES);
          setHasCustomServices(false);
        }
      },
      () => {
        setServices(DEFAULT_SERVICES);
      },
    );

    const unsubProjects = onSnapshot(
      query(collection(db, 'projects'), orderBy('order', 'asc')),
      (snap) => {
        if (!snap.empty) {
          setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PortfolioProject)));
          setHasCustomProjects(true);
        } else {
          setProjects(DEFAULT_PROJECTS);
          setHasCustomProjects(false);
        }
      },
      () => {
        setProjects(DEFAULT_PROJECTS);
      },
    );

    const unsubTeam = onSnapshot(
      query(collection(db, 'team_members'), orderBy('order', 'asc')),
      (snap) => {
        setTeamMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember)));
      },
      () => {
        setTeamMembers([]);
      },
    );

    return () => {
      unsubSite();
      unsubServices();
      unsubProjects();
      unsubTeam();
    };
  }, []);

  return {
    siteContent,
    services,
    projects,
    teamMembers,
    loading,
    hasCustomServices,
    hasCustomProjects,
  };
}
