import type { PortfolioProject, ServiceItem, SiteContent } from '../types';

export const HERO_VISUAL_URL = '/src/assets/images/hero_digital_workspace_1795273669192.jpg';

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroHeadline: 'Building Digital Experiences That Move You Forward.',
  heroDescription:
    'From creative websites to powerful applications, WebTrex transforms your ideas into innovative digital experiences.',
  aboutHeadline: 'More Than Development. We Build Possibilities.',
  aboutDescription:
    'WebTrex is a creative technology and digital development team helping individuals, startups, businesses, and organizations turn ambitious concepts into reliable, high-performing digital products.',
  mission:
    'To engineer purposeful websites, web and Android applications, and custom software that solve real operational challenges and create measurable momentum.',
  vision:
    'To be the trusted digital product partner for growing organizations worldwide—combining disciplined software architecture with timeless interface craft.',
  values:
    'Clarity in communication, accountability in delivery, respect for the end user, and continuous technical refinement across every release.',
  contactEmail: 'hello@webtrex.studio',
  contactPhone: 'Configurable in Admin Settings',
  contactLocation: 'Remote-First Digital Studio · Worldwide',
  businessHours: 'Mon – Fri · 09:00 – 18:00',
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'website-development',
    title: 'Website Development',
    description:
      'Responsive business websites, portfolio showcases, and full website redesigns engineered for speed, accessibility, and search visibility.',
    icon: 'globe',
    deliverables: [
      'Business & Corporate Websites',
      'Portfolio Websites & Redesigns',
      'SEO-Ready Semantic Architecture',
      'Sub-Second Asset Optimization',
    ],
    order: 1,
    active: true,
  },
  {
    id: 'application-development',
    title: 'Application Development',
    description:
      'Full-stack web applications and native Android applications built with secure authentication, real-time data synchronization, and clean APIs.',
    icon: 'smartphone',
    deliverables: [
      'Web Application Engineering',
      'Android Application Development',
      'Cloud Database & Auth Integration',
      'Role-Based Dashboards & Portals',
    ],
    order: 2,
    active: true,
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX Design',
    description:
      'Human-centered product interfaces, interactive wireframes, and cohesive design systems crafted for effortless navigation on every screen.',
    icon: 'layers',
    deliverables: [
      'User Flows & Information Architecture',
      'Responsive Component Libraries',
      'Interactive Product Prototypes',
      'Accessibility & Contrast Audits',
    ],
    order: 3,
    active: true,
  },
  {
    id: 'ecommerce-solutions',
    title: 'E-commerce Solutions',
    description:
      'Conversion-focused online storefronts with structured product catalogs, inventory workflows, and streamlined checkout journeys.',
    icon: 'shopping-bag',
    deliverables: [
      'Custom Storefront Architecture',
      'Product & Category Management',
      'Order & Customer Portals',
      'Performance & Mobile Checkout Tuning',
    ],
    order: 4,
    active: true,
  },
  {
    id: 'custom-software',
    title: 'Custom Software',
    description:
      'Tailored internal tools, workflow automation systems, and client portals designed around your exact operational requirements.',
    icon: 'cpu',
    deliverables: [
      'Internal Operations Platforms',
      'API & Third-Party Integrations',
      'Automated Reporting Workflows',
      'Scalable Modular Codebases',
    ],
    order: 5,
    active: true,
  },
  {
    id: 'website-maintenance',
    title: 'Website Maintenance',
    description:
      'Proactive technical support, security updates, uptime monitoring, and iterative feature enhancements that keep your product dependable.',
    icon: 'wrench',
    deliverables: [
      'Ongoing Technical Support',
      'Security Patches & Dependency Updates',
      'Performance & Core Web Vitals Audits',
      'Content & Feature Iterations',
    ],
    order: 6,
    active: true,
  },
];

export const DEFAULT_PROJECTS: PortfolioProject[] = [
  {
    id: 'demo-corporate-platform',
    title: 'Meridian Corporate Web Platform',
    category: 'Websites',
    description:
      'A responsive B2B corporate web presence featuring modular service pages, structured documentation, and a streamlined lead intake workflow.',
    clientType: 'Demo Concept · Enterprise Web',
    isDemo: true,
    imageUrl: '/src/assets/images/project_fintech_web_1795273670151.jpg',
    highlights: [
      'Responsive desktop, tablet, and mobile layout',
      'Accessible typography and high-contrast navigation',
      'Integrated contact & project scoping workflow',
    ],
    order: 1,
  },
  {
    id: 'demo-cloud-operations-suite',
    title: 'CloudMetrics Web & Android Suite',
    category: 'Applications',
    description:
      'Cross-platform web and Android operational application enabling teams to track live metrics, manage workspaces, and review reports seamlessly.',
    clientType: 'Demo Concept · Web & Android App',
    isDemo: true,
    imageUrl: '/src/assets/images/project_analytics_app_1795273669012.jpg',
    highlights: [
      'Synchronized web dashboard and Android mobile companion',
      'Role-based access control and real-time data sync',
      'Tabular metric views built for high scannability',
    ],
    order: 2,
  },
  {
    id: 'demo-commerce-design-system',
    title: 'Terra Storefront UI/UX System',
    category: 'UI/UX',
    description:
      'End-to-end e-commerce interface architecture and design system pairing editorial product photography with friction-free mobile navigation.',
    clientType: 'Demo Concept · UI/UX & E-Commerce',
    isDemo: true,
    imageUrl: '/src/assets/images/project_commerce_ux_1795273669464.jpg',
    highlights: [
      'Unified typography, spacing, and grid specifications',
      'Mobile-first product discovery and cart flows',
      'Reusable component tokens for engineering handoff',
    ],
    order: 3,
  },
];

export const PROJECT_TYPE_OPTIONS = [
  'Website Development',
  'Web Application Development',
  'Android Application Development',
  'UI/UX Design',
  'E-commerce Website',
  'Business / Portfolio Website',
  'Custom Software Development',
  'Website Redesign',
  'Technical Support & Maintenance',
];

export const BUDGET_OPTIONS = [
  'Not specified / Flexible',
  'Under $2,500',
  '$2,500 – $7,500',
  '$7,500 – $20,000',
  '$20,000+',
];

export const TIMELINE_OPTIONS = [
  'Flexible',
  '2 – 4 Weeks',
  '1 – 2 Months',
  '3+ Months',
];
