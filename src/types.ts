import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'client' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  company?: string;
  phone?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  notificationsEnabled: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type ServiceIconKey =
  | 'globe'
  | 'smartphone'
  | 'layers'
  | 'shopping-bag'
  | 'cpu'
  | 'wrench'
  | 'code'
  | 'shield';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: ServiceIconKey;
  deliverables: string[];
  order: number;
  active: boolean;
  updatedAt?: Timestamp | null;
}

export type ProjectCategory = 'Websites' | 'Applications' | 'UI/UX';

export interface PortfolioProject {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  clientType: string;
  isDemo: boolean;
  imageUrl: string;
  highlights: string[];
  liveUrl?: string;
  order: number;
  updatedAt?: Timestamp | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  linkedinUrl?: string;
  githubUrl?: string;
  xUrl?: string;
  order: number;
  updatedAt?: Timestamp | null;
}

export interface SiteContent {
  heroHeadline: string;
  heroDescription: string;
  aboutHeadline: string;
  aboutDescription: string;
  mission: string;
  vision: string;
  values: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  businessHours: string;
  updatedAt?: Timestamp | null;
}

export type RequestStatus =
  | 'pending'
  | 'in-review'
  | 'approved'
  | 'in-progress'
  | 'completed'
  | 'declined';

export interface ProjectRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  projectType: string;
  budget: string;
  timeline: string;
  details: string;
  status: RequestStatus;
  adminNotes: string;
  progress: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type MessageStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  projectType: string;
  budget: string;
  details: string;
  userId: string;
  status: MessageStatus;
  replyMessage: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type ClientProjectPhase =
  | 'Discovery'
  | 'Design'
  | 'Development'
  | 'Testing'
  | 'Launched';

export interface ClientProject {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  category: string;
  phase: ClientProjectPhase;
  progress: number;
  nextMilestone: string;
  previewUrl: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type AppView = 'public' | 'user-dashboard' | 'admin-dashboard';
