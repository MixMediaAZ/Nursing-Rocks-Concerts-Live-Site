# Nursing Rocks! Concert Series

A full-stack web application for managing and showcasing the Nursing Rocks! Concert Series, featuring video uploads, event management, job board, and more.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Video Streaming**: HLS.js + Backblaze B2
- **Authentication**: JWT
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm or yarn
- PostgreSQL database (or Neon Serverless)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
├── client/          # Frontend React application
├── server/          # Backend Express.js API
├── shared/          # Shared TypeScript types and schemas
├── api/             # Vercel serverless functions
├── migrations/      # Database migrations
└── public/          # Static assets
```

## Environment Variables

See `.env.example` for all required environment variables.

## Deployment & Documentation

### Quick Links
- **Project Status (Current):** [PROJECT_COMPLETION_SUMMARY.md](./PROJECT_COMPLETION_SUMMARY.md) — **98%+ complete, production-ready**
- **Deployment Guide:** [DEPLOY.md](./DEPLOY.md) + [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)
- **Environment Variables:** [.env.example](./.env.example)
- **Security:** [SECURITY.md](./SECURITY.md)
- **Jobs Board Status:** [NRCS_JOBS_BOARD_AUDIT.md](./NRCS_JOBS_BOARD_AUDIT.md)
- **Documentation Reconciliation:** [.forge/DOCS_RECONCILIATION.md](./.forge/DOCS_RECONCILIATION.md)
- **Forge Workflow:** [.forge/FORGE_PROTOCOL.md](./.forge/FORGE_PROTOCOL.md)

### Deploying
1. Set environment variables per [DEPLOY.md](./DEPLOY.md)
2. Run `npm run build` (should succeed)
3. Deploy to Vercel with `vercel deploy --prod`

**User Data:** Login, tickets, licenses, and orders are in the database and persist across deployments. See [DEPLOY.md](./DEPLOY.md) for details.

## Features

- 🎥 Video upload and streaming
- 🎫 Event and ticket management
- 💼 Job board for healthcare professionals
- 📸 Gallery management
- 👤 User authentication and profiles
- 🔐 License verification
- 🛍️ Store (Coming Soon)
- 📅 Event calendar (Coming Soon)

## License

MIT
