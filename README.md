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

## Deployment

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

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
