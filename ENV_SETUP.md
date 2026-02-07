# Environment Variables Setup

## Required for Vercel Deployment

### Database (Neon PostgreSQL recommended)
- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@host:5432/dbname?sslmode=require`)

### NextAuth.js
- `NEXTAUTH_SECRET` - Random secret key for session encryption (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (e.g., `https://your-app.vercel.app`) - Optional on Vercel (auto-detected via VERCEL_URL)

### App Settings
- `NEXT_PUBLIC_APP_NAME` - App display name (default: "Fiterre Resource Hub")

## Vercel Auto-provided Variables
These are automatically set by Vercel:
- `VERCEL_URL` - The URL of the deployment (used as fallback for NEXTAUTH_URL)
- `VERCEL_ENV` - The environment (production, preview, development)

## Database Setup on Vercel

1. Go to Vercel Dashboard → Storage → Create Database
2. Select "Neon Postgres"
3. The DATABASE_URL will be automatically added to your environment variables

## Quick Setup Steps

1. Connect your GitHub repository to Vercel
2. Add the required environment variables in Vercel Dashboard → Settings → Environment Variables:
   - `DATABASE_URL` (from Neon or your PostgreSQL provider)
   - `NEXTAUTH_SECRET` (generate a secure random string)
3. Deploy!

## Local Development

Create a `.env.local` file with:
```
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```
