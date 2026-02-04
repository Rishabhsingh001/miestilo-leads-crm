# 🚀 Final Deployment Step: Supabase

Your code is now 100% converted to use **Supabase (PostgreSQL)**.
I have removed all local database files (`dev.db`, `migrations`).

## 1. Get Your Database URL
1.  Go to [Supabase.com](https://supabase.com/dashboard) and create a **New Project**.
2.  Once created, go to **Project Settings** -> **Database**.
3.  Find **Connection Parameters**.
4.  Copy the **URI**. (It looks like `postgresql://postgres...`).
    *   *Note:* Use the "Transaction Pooler" (port 6543) for `DATABASE_URL`.
    *   Use the "Session" (port 5432) for `DIRECT_URL`.

## 2. Connect
1.  **Locally**: Paste these URLs into your `.env` file.
2.  **Vercel**:
    *   Go to Vercel Dashboard -> Settings -> Environment Variables.
    *   Add `DATABASE_URL` and `DIRECT_URL`.

## 3. Push Schema
Run this command in your terminal to create the tables in Supabase:
```bash
npx prisma db push
```

## 4. Deploy
```bash
npx vercel deploy --prod
```
