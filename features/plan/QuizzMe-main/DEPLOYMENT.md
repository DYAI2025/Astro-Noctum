# Deployment Guide: QuizzMe (AstroSheet)

## Status Update 🟢
The application code has been fixed and successfully passed the build process (`npm run build`). It is ready for deployment.

## Recommended Workflow
The user request was to "host on GitHub Pages and deploy to Vercel". The standard industry practice matching your project architecture (Next.js + Middleware) is:
1.  **Source Code Hosting:** GitHub (Repository)
2.  **Live Application Hosting:** Vercel (Builds & Serving)

**Why not GitHub Pages for the App?**
Your application uses `middleware.ts` for dynamic routing (locale handling, multi-domain support). GitHub Pages only supports static sites and cannot execute this middleware. **Vercel is required** for your app to function correctly.

---

## Step 1: Push Code to GitHub
Your local code has important fixes (Routing & Onboarding) that need to be saved.

```bash
git add .
git commit -m "Fix: Routing and Onboarding for Deployment"
git push origin main
```

## Step 2: Deploy to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub Repository (`QuizzMe`).
4.  **Configure Project:**
    *   **Framework:** Next.js (Automatic)
    *   **Root Directory:** `.` (default)
    *   **Environment Variables:**
        *   `NEXT_PUBLIC_SUPABASE_URL`: [Your URL]
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Your Key]
5.  Click **"Deploy"**.

## Step 3: Verify
Once deployed, Vercel will give you a URL (e.g., `quizzme.vercel.app`).
*   Check `/` (Should redirect to `/astrosheet`)
*   Check `/onboarding/astro` (Should show the simplified "Origin Point" screen)
*   Check `/agents` (Should work without 404)

## Troubleshooting
If the build fails on Vercel:
*   Check the "Build Logs" in Vercel.
*   Ensure all Environment Variables are set.
