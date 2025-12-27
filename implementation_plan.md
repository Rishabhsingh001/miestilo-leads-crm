
# Implementation Plan - MiEstilo Leads CRM

This plan outlines the development of a custom CRM/Lead Management System for a manufacturing business.

## User Requirements Checklist
- [ ] **Tech Stack**: Next.js, Tailwind CSS, Supabase (Database only).
- [ ] **Auth**: Custom Manual CRUD (No Supabase Auth).
- [ ] **Design**: Clean, modern, B2B, Light theme, Sidebar layout.
- [ ] **Modules**:
    - [ ] Login (Manual)
    - [ ] Dashboard (Charts, Stats)
    - [ ] Leads (CRUD, Filtering, Status workflow)
    - [ ] Follow-ups (Scheduler)
    - [ ] Customers (Converted leads)
    - [ ] Users (Admin User Management)

## Proposed Architecture
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Lucide React (Icons)
- **State Management**: React Context (for Auth State) + SWR or React Query (for Data Fetching) -> *Actually, sticking to simple fetch/useEffect for beginner-friendliness as requested.*
- **Database**: Supabase (Table interaction via `supabase-js`)
- **Charts**: Recharts

## Step-by-Step Implementation

### Phase 1: Setup & Configuration
- [ ] Initialize Next.js project with Tailwind.
- [ ] Install dependencies: `@supabase/supabase-js`, `lucide-react`, `recharts`, `clsx`, `tailwind-merge`.
- [ ] Configure `tailwind.config.ts` for custom colors (Business Look).
- [ ] Set up Supabase Client (`/services/supabase.js` or `/lib/supabase.ts`).

### Phase 2: Core UI Components (Design System)
- [ ] Create layout wrappers (`DashboardLayout`, `AuthLayout`).
- [ ] Build navigation Sidebar.
- [ ] Create reusable UI components:
    - [ ] `Button`, `Input`, `Card`, `Badge`, `Table`.

### Phase 3: Authentication (Manual)
- [ ] specific `Users` table schema definition (mocked or SQL provided).
- [ ] Implement `AuthContext` to handle `localStorage` user persistence.
- [ ] Build `/login` page:
    - [ ] Validate User against Supabase `users` table.
    - [ ] Store session in `localStorage`.
- [ ] Implement Route Protection (HOC or Layout check).

### Phase 4: Dashboard & Leads
- [ ] Build Dashboard overview (Stats cards, Simple Chart).
- [ ] Build Leads CRUD:
    - [ ] List View (Table with sorting/filtering).
    - [ ] Add/Edit Form.
    - [ ] View Details Page.
- [ ] Implement Status Workflow (New -> Converted).

### Phase 5: Follow-ups & Customers
- [ ] Build Follow-ups module (Date picker, Notes).
- [ ] Build Customers module (Read-only list of converted leads).

### Phase 6: Admin Extensions
- [ ] Build User Management (Admin only) to add sales staff.

### Phase 7: Polish
- [ ] Final UI cleanup.
- [ ] Error handling & Empty states.
