# Security Specification & Payload-First TDD (WebTrex)

## 1. Data Invariants
1. **User Role Integrity**: A standard user registering in `/users/{userId}` can only create their profile with `role == 'client'` and `status == 'active'`, and `uid == request.auth.uid`. Users cannot modify `role`, `status`, `uid`, or `createdAt` on update.
2. **Admin Authorization**: Only verified administrators (`request.auth.token.email_verified == true` AND either the bootstrapped admin email `muhammedzahran5434@gmail.com` or an existing document in `/admins/{request.auth.uid}`) can manage services, portfolio projects, team members, site content, client projects, or update arbitrary users/requests/messages.
3. **Private Data Isolation**: `/users/{userId}`, `/project_requests/{requestId}`, `/contact_messages/{messageId}`, and `/client_projects/{clientProjectId}` enforce strict `isOwner` or `isAdmin()` checks on both `get` and `list`. Public visitors cannot read other users' emails, requests, or inquiries.
4. **Temporal & Schema Integrity**: Every document write validates exact allowed keys (`hasAll` + `hasOnly`), string `.size()` bounds, numeric bounds, valid document IDs (`isValidId`), and server timestamps (`request.time`) on `createdAt`/`updatedAt`.
5. **Terminal State Protection**: Once a `project_request` moves beyond `'pending'`, the submitting user can no longer edit or delete it; only admins can advance or resolve its state.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Assigned Admin Role**: `POST /users/{uid}` with `{ role: "admin", ... }` by non-admin -> `PERMISSION_DENIED`.
2. **Shadow Field Injection**: `POST /users/{uid}` with extra field `{ isSuperUser: true, ... }` -> `PERMISSION_DENIED`.
3. **Unverified Admin Email Spoof**: Request with `email == 'muhammedzahran5434@gmail.com'` and `email_verified == false` -> `PERMISSION_DENIED`.
4. **Cross-User Profile Read**: `GET /users/victimUid` as `attackerUid` -> `PERMISSION_DENIED`.
5. **Blanket List Scraping**: `LIST /project_requests` without `where('userId', '==', uid)` as non-admin -> `PERMISSION_DENIED`.
6. **Impersonated Project Request**: `POST /project_requests/{id}` with `userId: 'victimUid'` while signed in as `attackerUid` -> `PERMISSION_DENIED`.
7. **Timestamp Forgery**: `POST /contact_messages/{id}` with `createdAt: Timestamp(1999)` -> `PERMISSION_DENIED`.
8. **Progress / Status Tampering**: Client updating own `project_request` with `{ status: 'approved', progress: 100 }` -> `PERMISSION_DENIED`.
9. **Terminal State Modification**: Client editing a `project_request` whose status is `'in-progress'` -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Creating `/services/invalid$id!with/slash` or 500-char ID -> `PERMISSION_DENIED`.
11. **Value Poisoning / Resource Exhaustion**: Submitting `details` string > 2000 chars or `deliverables` array > 8 items -> `PERMISSION_DENIED`.
12. **Unauthorized Catalog Mutation**: Non-admin attempting `UPDATE /site_content/main` or `DELETE /projects/{id}` -> `PERMISSION_DENIED`.
