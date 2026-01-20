# Mikromedia CRM

Recent, modern CRM system for Mikromedia.

## Tech Stack
- Next.js 15 (App Router)
- React, Tailwind CSS, ShadCN UI
- Supabase (Auth, DB, Realtime)
- Recharts

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your Supabase URL and Anon Key.
   ```bash
   cp .env.example .env.local
   ```

3. **Supabase Setup**
   - Go to your Supabase Dashboard.
   - Go to the SQL Editor.
   - Copy the content of `supabase/schema.sql` and run it. This will create all tables and RLS policies.
   - Go to Authentication -> Providers -> Email and ensure it is enabled.
   - (Optional) Disable "Confirm email" for faster testing if desired.

4. **Run Locally**
   ```bash
   npm run dev
   ```

## Modules
- **Authentication**: Role-based access (Admin, Manager, Sales).
- **Dashboard**: Stats and charts.
- **Leads**: Manage leads with status tracking.
- **Tasks**: (Skeleton provided, needs implementation).
- **Activity Logs**: (Skeleton provided).

## Deployment
- Deploy to Vercel.
- ensure Environment Variables are set in Vercel Project Settings.
