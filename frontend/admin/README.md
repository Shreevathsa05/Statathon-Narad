# NARAD Admin Panel

This directory (`frontend/Admin`) contains the React-based frontend application for the NARAD (National Automated Response and Data System) administrative and field operations platform.

## 🛠 Technology Stack
- **Framework:** React 18 + Vite
- **Routing:** React Router DOM (v6)
- **Data Fetching & API:** Native `fetch()` (with custom wrapper and interceptors for auth)
- **Styling:** Custom CSS based on the Vercel Geist Design System (Light Theme)
- **Icons:** Lucide React

---

## 🎨 Design System
The application strictly follows a data-dense, minimalist **Geist Light Theme** architecture (`src/index.css`).
- **Typography:** Uses `Geist` (Sans) for UI and body text, and `Geist Mono` for IDs, technical identifiers, and emails.
- **Color Palette:** Strictly monochrome surfaces (`#FFFFFF`, `#FAFAFA`) with high-contrast borders and text. Action colors are limited to pure blue (`#0070F3`) for primary states, red (`#E60000`) for destructive actions, and specific role-based accent colors (e.g., green for FOD, purple for DPD).
- **Icons:** Integrated with `lucide-react` for aesthetic, minimal line icons across sidebars, tables, and buttons.

---

## 🔐 Authentication & Session Flow
The app relies on a stateless JWT architecture managed via `httpOnly` cookies from the `backend/main2` service.

### 1. Progressive Login (`/login`)
- **Step 1:** The user enters their `@mospi.gov` email. The frontend calls `/api/auth/check-email`.
- **Step 2:** 
  - If the account is `pending_setup` (a newly invited user), they are redirected to `/setup-password` to create their password.
  - If the account is `active`, they are prompted for their password on the same screen.

### 2. Global State (`AuthContext.jsx`)
- Upon mounting, `AuthContext` calls `/api/auth/me` to hydrate the user state.
- While the request resolves, an `isLoading` spinner blocks route transitions.
- Exposes `user`, `login`, `setupPassword`, and `logout` functions to the entire React tree.

### 3. Fetch Wrapper & Interceptor (`api/client.js`)
- Protects against expired sessions automatically.
- If *any* API request returns a `401 Unauthorized`:
  1. The interceptor pauses the request.
  2. It attempts to call `/api/auth/refresh` to rotate the short-lived access token using the 7-day refresh cookie.
  3. If successful, it replays the original failed request seamlessly.
  4. If the refresh also fails (e.g., refresh token expired or logged out), it redirects the user to `/login` (unless they are already on the login page).

---

## 🛡 Routing & Role-Based Access Control (RBAC)

Routing is centrally managed in `src/App.jsx` using `React Router`.

### 1. The Dashboard Hub (`/dashboard`)
When a user logs in, they are sent to `/dashboard`. This is a "smart" routing hub that looks at `user.role` and instantly redirects them to their respective division's workspace:
- `admin` → `/admin/users`
- `sdrd` → `/sdrd`
- `fod` → `/fod`
- `field_manager` → `/fod-manager`
- `field_agent` → `/field-agent`
- `dpd` → `/dpd`
- `cqcd` → `/cqcd`

### 2. Route Protection (`ProtectedRoute.jsx`)
Individual routes are guarded by the `ProtectedRoute` component.
- Example: `<ProtectedRoute allowedRoles={['admin', 'fod']}>`
- If an unauthenticated user accesses it, they are sent to `/login`.
- If a logged-in user accesses a route without the required role (e.g., a Field Agent trying to access SDRD), they are booted back to `/dashboard` (which redirects them safely to their own area).

### 3. Role-Aware Sidebar (`Sidebar.jsx`)
The sidebar navigation dynamically renders different sections based on `user.role`. An admin sees all division tabs, while a Field Agent only sees their specific "My Work" section.

---

## 📂 Project Structure

```text
src/
├── api/
│   └── client.js             # Axios instance + 401 refresh interceptor
├── components/
│   ├── InviteUserModal.jsx   # Admin/FOD form to generate users & emails
│   ├── ProtectedRoute.jsx    # RBAC wrapper for React Router
│   ├── RoleBadge.jsx         # Color-coded division badge
│   ├── Sidebar.jsx           # Role-aware left navigation
│   ├── TopBar.jsx            # Top bar with current user info & logout
│   └── UserTable.jsx         # Universal table for displaying users
├── context/
│   └── AuthContext.jsx       # Global JWT Auth State Manager
├── pages/
│   ├── admin/                # Root Admin views (User Management)
│   ├── sdrd/                 # Survey Builder views
│   ├── fod/                  # Multichannel Delivery views
│   ├── dpd/                  # Data Processing views
│   ├── cqcd/                 # Report Publishing views
│   ├── field-manager/        # Field Ops Management views
│   ├── field-agent/          # CAPI On-ground views
│   ├── DashboardPage.jsx     # Smart routing hub
│   ├── LoginPage.jsx         # Progressive login
│   └── SetupPasswordPage.jsx # First-time user onboarding
├── App.jsx                   # Central Router configuration
├── index.css                 # Geist Design System Tokens
└── main.jsx                  # React Entry
```

---

## 🏗️ Recent Architectural Updates (June 2026)

- **Translation Pipeline UI Safety:** Implemented robust locking mechanisms in `SurveyEditor.jsx`. The "AI Improve" and "Edit" buttons are now disabled if a translation is in progress or if translations already exist, preventing desynchronization. Added visual states to disable already-translated languages in the translation panel.
- **Multilingual Viewer Toggle:** Added a dynamic `viewLang` state and dropdown in `SurveyEditor.jsx` that instantly switches the entire survey editor's display mode between English and generated regional languages, automatically falling back to English for any missing translations.
- **Layout & Scrolling Fixes:** Patched `SurveyEditor` and `ManualBuilder` to correctly wrap their contents in `.main-content` and `.page-body` classes. This ensures they do not inherit the global `overflow: hidden` from the root `.app-shell`, restoring native vertical scrolling. Eliminated the `24px` top padding gap that was causing content to slide awkwardly underneath the sticky header.
- **Vite Proxy & Port Alignment:** The frontend explicitly routes `/api` to `localhost:3000` (main2 backend) and `/question-generation` to `localhost:3001` (AI microservice) via `vite.config.js`. This eliminates the need for local `.env` files and prevents port conflicts.
- **ApiResponse Data Unpacking:** Fixed critical bugs in `SurveyEditor.jsx` where the frontend failed to unwrap the standardized `ApiResponse` from the main2 backend, correctly accessing `.data.data` instead of just `.data`.
