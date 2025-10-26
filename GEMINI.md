# GEMINI.md

## Project Overview

This is the frontend for the ICAP Survey Platform, a modern, high-performance web application built with Hono, Cloudflare Pages, and Supabase. The frontend is responsible for rendering the user interface and interacting with the backend API.

**Key Technologies:**

*   **Framework:** Hono
*   **Runtime:** Cloudflare Pages
*   **Backend API:** Django REST API
*   **Database:** Supabase PostgreSQL
*   **Styling:** Tailwind CSS
*   **Language:** TypeScript
*   **Build Tool:** Vite

**Architecture:**

The application follows a server-side rendering (SSR) architecture with Hono. The frontend code is organized into `client` and `server` directories. The `server` directory contains the Hono application, which handles routing, middleware, and server-side rendering of Preact components. The `client` directory contains the client-side code that runs in the browser.

## Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Setup Environment:**

Create a `.dev.vars` file in the root of the project and add the following environment variables:

```
DJANGO_API_KEY=your-django-api-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-secret-key-here
```

**3. Generate Supabase Types (Optional):**

```bash
npm run types:generate
```

**4. Start the Development Server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

**5. Build for Production:**

```bash
npm run build
```

**6. Deploy to Cloudflare Pages:**

The project is configured for automatic deployments to Cloudflare Pages via GitHub Actions. Pushes to the `main` branch are deployed to production, and pushes to the `staging` branch are deployed to a staging environment.

Manual deployments can be done using the following commands:

```bash
# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

## Development Conventions

*   **Code Style:** The project uses Prettier for code formatting and ESLint for linting.
*   **Testing:** TODO: Add information about the testing strategy.
*   **Branching:** Features should be developed in separate branches and merged into `main` via pull requests.
*   **Commits:** Commit messages should follow the Conventional Commits specification.
