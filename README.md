# ICAP Survey Platform - Frontend

Modern, high-performance frontend for the ICAP Survey Platform built with **Hono + Cloudflare Pages + Supabase**.

## 🏗️ Architecture

```
Frontend (Cloudflare Pages)
  ↓
Hono SSR + API Routes
  ↓
Supabase PostgreSQL (Direct Queries)
  +
Django OMR Backend (Future - when documented)
```

## 🚀 Tech Stack

- **Framework**: [Hono](https://hono.dev) - Ultrafast web framework for the edge
- **Runtime**: Cloudflare Pages Functions
- **Backend API**: Django 5.2.1 + DRF 3.15.2 (deployed on Cloudflare Workers)
- **Database**: Supabase PostgreSQL
- **Styling**: TailwindCSS + Inter font
- **Language**: TypeScript
- **Build Tool**: Vite

## 🌐 Production Endpoints

- **Frontend**: `https://hackathon2-icap.pages.dev` (auto-deployed from `main`)
- **Backend API**: `https://api-psycho.edgar-gomero.workers.dev`
- **Database**: Supabase (qetwmgvlqzevksqnhruz.supabase.co)

## 📁 Project Structure

```
hackathon2/
├── src/
│   ├── server/              # Server-side code (Hono)
│   │   ├── index.tsx        # Main Hono app
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Auth, RBAC, etc.
│   │   ├── services/        # Supabase, Django clients
│   │   └── components/      # Server components (future)
│   ├── client/              # Client-side JavaScript
│   ├── shared/              # Shared types & utilities
│   │   └── types/           # TypeScript definitions
│   └── styles/              # Global CSS
├── functions/               # Cloudflare Pages Functions
│   └── api/[[route]].ts     # Catch-all API handler
├── wrangler.toml            # Cloudflare configuration
├── vite.config.ts           # Vite configuration
└── package.json
```

## 🛠️ Installation

### Prerequisites

- Node.js >= 18.0.0
- npm, pnpm, or yarn
- Wrangler CLI (Cloudflare)
- Access to Supabase project

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Create `.dev.vars` file for local development:

```bash
# .dev.vars (local secrets)
DJANGO_API_KEY=your-django-api-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-secret-key-here
```

The `wrangler.toml` already has non-sensitive variables configured.

### 3. Generate Supabase Types (Optional)

```bash
npm run types:generate
```

This creates TypeScript types from your Supabase schema.

## 🏃 Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Testing API Endpoints

```bash
# Health check
curl http://localhost:5173/api/health

# Get user info (requires auth token)
curl http://localhost:5173/api/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List students
curl http://localhost:5173/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚢 Deployment

This project uses **automatic CI/CD** via GitHub Actions → Cloudflare Pages.

### 🔄 Automatic Deployments

Every push triggers automatic deployment:

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | `https://hackathon2-icap.pages.dev` |
| `staging` | Staging | `https://hackathon2-icap-staging.pages.dev` |
| Pull Requests | Preview | Temporary URL (commented on PR) |

**Workflow:**
1. Push to `main` or `staging`
2. GitHub Actions runs quality checks (TypeScript, Linting)
3. Builds the project
4. Deploys to Cloudflare Pages
5. Deployment URL available instantly

### 📋 First Time Setup

**Required** (one-time only):

1. **Configure GitHub Secrets**: See [.github/DEPLOYMENT_CHECKLIST.md](.github/DEPLOYMENT_CHECKLIST.md)
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. **Configure Environment Variables** in Cloudflare Pages Dashboard
   - `DJANGO_API_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (encrypted)
   - `DJANGO_API_KEY` (encrypted)

3. **Create Projects** in Cloudflare Pages:
   - `hackathon2-icap` (production)
   - `hackathon2-icap-staging` (staging)

**Complete guide**: [DEPLOYMENT.md](DEPLOYMENT.md)

### 🚀 Manual Deployment (Optional)

If needed, deploy manually:

```bash
# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

**Requires**: Wrangler CLI logged in (`npx wrangler login`)

## 🔐 Authentication Flow

1. User logs in via Django (or future auth system)
2. Receives JWT token with claims: `sub` (user_id), `role`, `name`
3. Frontend includes token in `Authorization: Bearer <token>` header
4. `authMiddleware` validates JWT
5. `clinicContextMiddleware` fetches clinic from `user_profile` table
6. All queries automatically scoped to user's clinic

## 📊 Available Routes

### Public Routes
- `GET /api/health` - Health check
- `GET /api/version` - API version info

### Protected Routes (require auth)
- `GET /api/me` - Get current user info
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Soft delete student

## 🎨 UI Components

The project uses TailwindCSS utility classes from the mockups with:

- Custom color palette (primary: #1173d4)
- Dark mode support
- Inter font family
- Reusable component classes (`.btn-primary`, `.card`, `.status-badge-*`)

## 🔧 Configuration

### Vite Configuration

Configured with:
- Dual build mode (client + server)
- Cloudflare Pages adapter
- Path aliases (`@/`, `@server/`, `@client/`, `@shared/`)

### TypeScript Configuration

Strict mode enabled with:
- JSX support (via `hono/jsx`)
- Cloudflare Workers types
- Module resolution: bundler

### Wrangler Configuration

- 3 environments: dev, staging, production
- KV namespace for caching
- Environment variables and secrets

## 📝 Next Steps

### Completed ✅
- [x] Project setup with Hono + Cloudflare Pages
- [x] Supabase integration with type generation
- [x] Django authentication integration (JWT)
- [x] Multi-tenant middleware (clinic-based isolation)
- [x] Students CRUD routes (API + SSR)
- [x] Dashboard with analytics (API + SSR)
- [x] CI/CD with GitHub Actions
- [x] Complete documentation (CLAUDE.md, DEPLOYMENT.md)

### Current Phase 🚧
- [ ] Chart visualizations (Chart.js integration)
- [ ] Surveys management (templates, assignments, responses)
- [ ] Call logs tracking (ElevenLabs integration)
- [ ] Reports generation (PDF export)

### Future Enhancements 🔮
- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics with filters
- [ ] Bulk operations (import/export students)
- [ ] Mobile responsive optimizations
- [ ] PWA support for offline access

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear build cache
rm -rf dist/ node_modules/.vite

# Reinstall dependencies
npm install
```

### Type Errors

```bash
# Regenerate Cloudflare types
npm run cf-typegen

# Regenerate Supabase types
npm run types:generate
```

### Wrangler Issues

```bash
# Check wrangler status
npx wrangler whoami

# Login to Cloudflare
npx wrangler login
```

## 📚 Documentation

- [Hono Documentation](https://hono.dev)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS](https://tailwindcss.com)

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes
3. Test locally with `npm run dev`
4. Deploy to staging with `npm run deploy:staging`
5. Create pull request

## 📄 License

[Your License Here]
