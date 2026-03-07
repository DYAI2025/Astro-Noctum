# Deployment Guide

This project is optimized for deployment on Vercel, but can be hosted on any platform supporting Next.js (Netlify, Docker, Node.js server).

## Vercel Deployment (Recommended)

1. **Push to Git**: Ensure your code is pushed to a remote repository (GitHub/GitLab).
2. **Import Project**:
   - Go to Vercel Dashboard -> Add New -> Project.
   - Select your repository.
3. **Configure Build**:
   - Framework Preset: `Next.js`
   - Build Command: `next build`
   - Output Directory: `.next`
   - *No special environment variables are strictly required for the public content.*
4. **Deploy**: Click "Deploy".

## Domain Configuration (Multi-Vertical)

To make use of the distinct "Quiz" and "Horoscope" verticals, you need to configure your Custom Domains in Vercel.

1. **Add Domains**:
   - Go to Project Settings -> Domains.
   - Add your domains, e.g., `www.mypersonalityquiz.com` and `www.dailyhoroscope.com`.

2. **Middleware Logic**:
   - The `src/middleware.ts` file automatically detects the hostname.
   - If the hostname includes "horoskop" or "horoscope", it serves the Horoscope vertical.
   - Otherwise, it serves the Quiz vertical.
   - *Ensure your domain names match this logic, or update `src/middleware.ts` to match your specific domain names.*

## Manual / Docker Deployment

1. **Build**:

   ```bash
   npm run build
   ```

2. **Start**:

   ```bash
   npm run start
   ```

   - The app runs on port 3000 by default.
   - You can use a reverse proxy (Nginx/Apache) to valid traffic from your domains to port 3000.
   - Pass the `Host` header correctly so the middleware can detect the domain.

## Content Management

- **Quizzes**: To edit quiz questions or results, modify the files in `src/components/quizzes/`.
- **Horoscope**: The daily horoscope text is currently static/placeholder. To connect a CMS or API, edit `src/app/verticals/horoscope/[sign]/page.tsx`.
