/**
 * Payload-First Security TDD Test Suite for WebTrex Firestore Rules
 * Verifies all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface AdversarialCase {
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const dirtyDozenCases: AdversarialCase[] = [
  {
    name: '1. Self-Assigned Admin Role on User Registration',
    collection: 'users/attacker123',
    operation: 'create',
    auth: { uid: 'attacker123', email: 'attacker@example.com', email_verified: true },
    payload: {
      uid: 'attacker123',
      email: 'attacker@example.com',
      displayName: 'Attacker',
      role: 'admin',
      status: 'active',
      notificationsEnabled: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Shadow Field Injection on User Profile',
    collection: 'users/user123',
    operation: 'create',
    auth: { uid: 'user123', email: 'user@example.com', email_verified: true },
    payload: {
      uid: 'user123',
      email: 'user@example.com',
      displayName: 'User',
      role: 'client',
      status: 'active',
      notificationsEnabled: true,
      isSuperUser: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Unverified Admin Email Spoof',
    collection: 'services/svc1',
    operation: 'create',
    auth: { uid: 'spoofUid', email: 'muhammedzahran5434@gmail.com', email_verified: false },
    payload: {
      title: 'Malicious Service',
      description: 'Injected by unverified email account',
      icon: 'globe',
      deliverables: ['Item 1'],
      order: 1,
      active: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Cross-User Profile Read',
    collection: 'users/victimUid',
    operation: 'get',
    auth: { uid: 'attackerUid', email: 'attacker@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Unfiltered List Scraping of Project Requests',
    collection: 'project_requests',
    operation: 'list',
    auth: { uid: 'attackerUid', email: 'attacker@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Impersonated Project Request Ownership',
    collection: 'project_requests/req1',
    operation: 'create',
    auth: { uid: 'attackerUid', email: 'attacker@example.com', email_verified: true },
    payload: {
      userId: 'victimUid',
      userEmail: 'victim@example.com',
      userName: 'Victim',
      title: 'Spoofed Request',
      projectType: 'Websites',
      budget: '$5k',
      timeline: '4 weeks',
      details: 'Submitting on behalf of another user',
      status: 'pending',
      adminNotes: '',
      progress: 0,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Client Timestamp Forgery on Contact Message',
    collection: 'contact_messages/msg1',
    operation: 'create',
    auth: null,
    payload: {
      fullName: 'Visitor',
      email: 'visitor@example.com',
      projectType: 'Websites',
      budget: '$10k',
      details: 'Testing forged timestamp submission',
      userId: '',
      status: 'new',
      replyMessage: '',
      createdAt: '1999-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Client Status & Progress Tampering on Project Request',
    collection: 'project_requests/req1',
    operation: 'update',
    auth: { uid: 'clientUid', email: 'client@example.com', email_verified: true },
    payload: {
      status: 'approved',
      progress: 100,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Modification of Non-Pending Project Request by Owner',
    collection: 'project_requests/reqInProgress',
    operation: 'update',
    auth: { uid: 'clientUid', email: 'client@example.com', email_verified: true },
    payload: {
      details: 'Trying to alter locked active request',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Document ID Poisoning with Oversized ID',
    collection: `services/${'a'.repeat(200)}`,
    operation: 'create',
    auth: { uid: 'adminUid', email: 'muhammedzahran5434@gmail.com', email_verified: true },
    payload: { title: 'Test', description: 'Valid desc text', icon: 'globe', deliverables: ['A'], order: 1, active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Value Poisoning / Oversized Payload',
    collection: 'contact_messages/msg2',
    operation: 'create',
    auth: null,
    payload: {
      fullName: 'Visitor',
      email: 'visitor@example.com',
      projectType: 'Websites',
      budget: '$5k',
      details: 'x'.repeat(2500),
      userId: '',
      status: 'new',
      replyMessage: '',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Unauthorized Site Content Mutation',
    collection: 'site_content/main',
    operation: 'update',
    auth: { uid: 'clientUid', email: 'client@example.com', email_verified: true },
    payload: {
      heroHeadline: 'Defaced Headline',
    },
    expected: 'PERMISSION_DENIED',
  },
];
