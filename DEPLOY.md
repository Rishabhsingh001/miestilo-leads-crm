# Deployment Guide for MiEstilo Leads CRM

This application uses **Next.js** and can be easily deployed to **Vercel**.

## Prerequisites

- A Vercel Account (https://vercel.com)
- Vercel CLI (optional, can deploy via Git)

## Important Note on Data Persistence

Currently, the application runs in **Demo Mode** using `localStorage`.

- **Data is stored in the browser:** Data you create will ONLY exist in the browser where you created it.
- **No Shared Database:** Other users (even if they have the link) will NOT see your data. They will see their own local data.
- **Data Loss:** If you clear your browser cache, all data will be lost.

## How to Deploy (Command Line)

1.  Open your terminal in this directory.
2.  Run the following command:
    ```bash
    npx vercel
    ```
3.  Follow the prompts:
    -   **Set up and deploy?** [Y]
    -   **Which scope?** [Select your account]
    -   **Link to existing project?** [N]
    -   **Project Name:** [miestilo-leads-crm]
    -   **Directory:** [./] (Default)
    -   **Want to modify settings?** [N] (Next.js presets work automatically)

4.  Wait for the deployment to finish. You will get a Production URL (e.g., `https://miestilo-leads-crm.vercel.app`).

## How to Deploy (Git Integration)

1.  Push this project to a GitHub/GitLab/Bitbucket repository.
2.  Go to Vercel Dashboard.
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your repository.
5.  Click **"Deploy"**.

## Post-Deployment

-   **Admin Login:** `admin@miestilo.com` / `admin`
-   **Verify:** Check that you can login and create data (it will be saved to your local browser).
