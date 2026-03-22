# Requirements: Nelo

**Defined:** 2026-03-20
**Core Value:** Accurate, transparent construction cost estimation through natural conversation — the user gets a detailed price breakdown they can trust.

## v1.0 Requirements (Validated)

All v1.0 requirements shipped and validated. See PROJECT.md Validated section for full list.

## v1.1 Requirements

Requirements for Persistence & Sharing milestone. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign in via email with magic link (clickable) and OTP (6-digit code) in the same email
- [ ] **AUTH-02**: User session persists across browser refresh via cookie-based auth tokens
- [ ] **AUTH-03**: Protected routes (/chat, /projects) redirect unauthenticated users to sign-in
- [ ] **AUTH-04**: User can sign out, clearing session and redirecting to landing page

### Chat Persistence

- [ ] **PERS-01**: Conversation auto-saves to Supabase after each assistant response completes (onFinish + consumeStream)
- [ ] **PERS-02**: User can resume a previous conversation from /chat/[id] with full message history loaded
- [ ] **PERS-03**: User sees a project list page (/projects) showing all past conversations
- [ ] **PERS-04**: Projects get auto-generated titles from the first user message, editable later

### Estimate Versioning

- [ ] **VERS-01**: Each runEstimate call creates an immutable snapshot (new row, old versions preserved)
- [ ] **VERS-02**: User can see a version history list for each project with timestamps
- [ ] **VERS-03**: User can compare two estimate versions side-by-side showing delta per category
- [ ] **VERS-04**: User can name/label estimate versions (e.g., "with pool", "steel frame option")

### Sharing

- [ ] **SHARE-01**: User can generate a shareable link for any estimate (public read-only, nanoid token)
- [ ] **SHARE-02**: Shared links support optional expiration dates
- [ ] **SHARE-03**: Floor plan images stored in Supabase Storage (replaces base64 in-memory)

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Collaboration
- **COLLAB-01**: Multiple users can view/edit the same project
- **COLLAB-02**: Real-time presence indicators on shared projects

### Export
- **EXPORT-01**: PDF export of estimate breakdown
- **EXPORT-02**: Excel/CSV export of line items

### Advanced Auth
- **AAUTH-01**: Social login (Google, GitHub)
- **AAUTH-02**: Team/organization accounts

### Professional Mode
- **PRO-01**: CAD file upload (DXF/DWG) with accurate dimension extraction
- **PRO-02**: Professional can override any calculated quantity or unit price
- **PRO-03**: Export estimate as professional presupuesto de obra document (PDF)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Social login (Google/GitHub) | Magic link + OTP covers the target audience; add later if needed |
| Real-time collaboration | High complexity; single-user persistence first |
| PDF export | Separate milestone — requires layout engine |
| Anonymous-first UX (chat without auth) | Adds complexity to persistence flow; require sign-in before chat for v1.1 |
| Supabase Realtime subscriptions | Not needed — standard request/response is sufficient |
| Custom SMTP (Resend/Postmark) | Use Supabase built-in email for now; upgrade for deliverability later |
| 3D visualization | Not needed for cost estimation |
| Native mobile app | Web-first, responsive design handles mobile |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| PERS-01 | TBD | Pending |
| PERS-02 | TBD | Pending |
| PERS-03 | TBD | Pending |
| PERS-04 | TBD | Pending |
| VERS-01 | TBD | Pending |
| VERS-02 | TBD | Pending |
| VERS-03 | TBD | Pending |
| VERS-04 | TBD | Pending |
| SHARE-01 | TBD | Pending |
| SHARE-02 | TBD | Pending |
| SHARE-03 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-22 after v1.1 requirements definition*
