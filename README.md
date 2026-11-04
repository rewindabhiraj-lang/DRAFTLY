# DRAFTLY — Premium Video Editor Hiring & Creative Marketplace

> **"Creative Talent. Extraordinary Results."**

DRAFTLY is a production-ready video editor hiring marketplace connecting creators, brands, agencies, and filmmakers with elite video editors, colorists, and motion graphics artists.

---

## 👑 Brand Identity & Aesthetics

- **Brand Name:** DRAFTLY
- **Official Logo:** `https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png`
- **Tagline:** *"Creative Talent. Extraordinary Results."*
- **Aesthetic:** Premium dark theme (`#080611`, `#100B1C`, `#171025`, `#9B5CFF`, `#BB86FF`), neon purple glow accents, modern glassmorphism, responsive across desktop, tablet, and mobile.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons
- **Backend & Database:** Cloud Firestore (database instance configured via Firebase Admin), Firebase Authentication
- **Fullstack Server:** Express (`server.ts`) with SPA fallback and API routes, listening on `process.env.PORT || 3000`
- **Hosting Compatibility:** Render Free, Cloud Run, Node.js PaaS

---

## 👥 Three Dedicated User Roles

### 1. CLIENT (`/dashboard`)
- Browse & search verified editors by genre, software, experience, rate, and rating
- Bookmark favorite editors (`savedEditors`)
- Send structured hiring requests with project title, brief, budget, and deadline
- Real-time Firestore direct chat with assigned editors
- Review submitted video cuts and download links
- Request timestamped revisions or release final approval
- Post verified star ratings and written reviews

### 2. EDITOR (`/editor` & `/editor/dashboard`)
- Dedicated registration experience with portfolio showreel, YouTube/Instagram links, rate, and availability
- Initial **pending approval** status strictly enforced by Firestore Security Rules
- Accept or decline incoming client proposals
- Manage in-progress orders and deliver finished master video links with notes
- Real-time chat with clients
- Earnings summary and client reviews archive

### 3. ADMIN (`/admin` & `/admin/dashboard`)
- Accessible strictly via `/admin` (never linked in public navbar)
- Provisioned for `rewindabhiraj@gmail.com` and `admins/` collection
- Review and approve/reject pending editor applications
- Suspend or reactivate editor and client accounts
- Create, edit, and delete video editing categories
- Moderate reviews, investigate user reports, and manage support tickets
- Global announcement banner controls and system audit logs

---

## 🔄 Hiring Workflow & Status Lifecycle

1. **Pending**: Client submits proposal to editor.
2. **Accepted / Rejected**: Editor reviews project scope and accepts or declines.
3. **In Progress**: Project channel opens for real-time video collaboration.
4. **Submitted**: Editor submits finalized deliverables (Google Drive, Vimeo, Frame.io) with export notes.
5. **Revision Requested**: Client requests specific timestamped adjustments.
6. **Completed**: Client approves final deliverables. Editor rating & review modal opens.
7. **Cancelled**: Client withdraws proposal before acceptance.

---

## 🔒 Firestore Security Rules

Hardened security rules (`firestore.rules`) enforce:
- Role-based access control with server-side admin verification (`isAdmin()`).
- Self-assigned admin role attempts strictly blocked on user creation.
- Public read access for marketplace browsing of approved editor profiles and categories.
- Strict ownership isolation for client proposals, direct messages, and bookmarks.
- Immutability of timestamps and core identifiers.

---

## 🚀 Deployment Instructions (Render Free)

1. **Build Command:**
   ```bash
   npm ci && npm run build
   ```

2. **Start Command:**
   ```bash
   npm start
   ```

3. **Required Environment Variables:**
   - `PORT`: (Set automatically by Render)
   - `NODE_ENV`: `production`
   - `ADMIN_EMAIL`: `rewindabhiraj@gmail.com`
