# CLAUDE.md

This file provides guidance to Claude Code when working with the **ICAP Survey Platform** project (hackathon2).

## Project Overview

**ICAP Survey Platform** is a full-stack Chilean HealthTech application for managing psychometric evaluations across educational institutions. The platform integrates with AI-powered calling systems and provides comprehensive survey management and reporting capabilities.

### Technology Stack

- **Frontend**: Hono 4.6.14 + Cloudflare Pages (SSR with Hono/JSX)
- **Backend API**: Django 5.2.1 + Django REST Framework 3.15.2
- **Authentication**: Django Simple JWT 5.3.0 (access: 1h, refresh: 1d)
- **Database**: PostgreSQL (accessed exclusively via Django ORM)
- **Deployment**: Cloudflare Pages (frontend) + Cloudflare Containers (backend)
- **AI Integration**: ElevenLabs (voice calls), Cloudflare Workers AI (future)

### Architecture Principle

**All data operations flow through Django API** - The frontend does NOT query the database directly. This ensures:
- ✅ Consistent multi-tenant filtering (Django ViewSets enforce `clinica_id`)
- ✅ Business logic stays in one place (Django models and serializers)
- ✅ Security (Row-level permissions enforced by Django)
- ✅ Easier auditing and compliance (all operations logged via Django middleware)

### Multi-Tenant Architecture

The platform implements multi-tenant isolation at two levels:
1. **Clinica** (Clinic) - Top-level tenant organization
2. **Institucion** (Educational Institution) - Sub-tenant under a clinic

All data queries must filter by `clinica_id` to ensure proper tenant isolation.

---

## Quick Reference Commands

### Development

```bash
# Frontend development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy:production  # or deploy:staging
```

### Django Backend API (api-psycho)

```bash
# Run Django development server
cd /home/kntor/Documentos/dev/api-psycho
python manage.py runserver 8000

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Deploy to Cloudflare Containers
wrangler deploy
```

---

## Django Backend API Documentation

### Base URL

- **Local Development**: `http://localhost:8000`
- **Production**: TBD (Cloudflare Containers deployment)

### Authentication

The platform uses **Django Simple JWT** for authentication with the following token lifetimes:

- **Access Token**: 1 hour
- **Refresh Token**: 1 day

All API requests (except auth endpoints) require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### User Roles & Permissions

The system defines 6 user roles with hierarchical permissions:

| Role | Level | Description | Permissions |
|------|-------|-------------|-------------|
| `superadmin` | 100 | Super Administrator | Full system access, manage all clinics |
| `clinica_admin` | 90 | Clinic Administrator | Manage clinic, institutions, users |
| `institucion_admin` | 80 | Institution Administrator | Manage institution students/surveys |
| `profesional` | 60 | Professional/Evaluator | Conduct evaluations, view reports |
| `agente_ia` | 40 | AI Agent | Automated calling system access |
| `readonly` | 10 | Read-only User | View-only access to assigned data |

**Key Properties** (users/models.py:66-76):
- `is_superadmin`: superadmin or Django superuser
- `is_clinica_admin`: superadmin or clinica_admin
- `is_institucion_admin`: superadmin, clinica_admin, or institucion_admin

---

## API Endpoints Reference

### Authentication Endpoints

Base path: `/api/auth/`

#### POST `/api/auth/login/`
Login and obtain JWT tokens.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhb...",
  "access": "eyJ0eXAiOiJKV1QiLCJhb...",
  "user": {
    "id": 1,
    "username": "admin@clinic.edu",
    "email": "admin@clinic.edu",
    "first_name": "Clinic",
    "last_name": "Admin",
    "role": "clinica_admin",
    "role_display": "Administrador de Clínica",
    "activo": true
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

#### POST `/api/auth/register/`
Register a new user.

**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password2": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "readonly",
  "clinica_id": "uuid (optional)"
}
```

**Response** (201 Created): Same as login response

#### POST `/api/auth/token/refresh/`
Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhb..."
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhb..."
}
```

#### POST `/api/auth/validate-token/`
Validate current access token and return user data.

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200 OK):
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "clinica_admin",
    "clinica_id": "uuid",
    "institucion_id": "uuid or null"
  }
}
```

---

### Data Management Endpoints

All data endpoints require authentication and automatically filter by the user's `clinica_id` for multi-tenant isolation.

Base path: `/api/data/`

#### Clinics - `/api/data/clinicas/`

**Model**: Clinica (icapapi/models.py:6-30)

```
GET    /api/data/clinicas/          # List clinics (superadmin only)
POST   /api/data/clinicas/          # Create clinic (superadmin only)
GET    /api/data/clinicas/{id}/     # Retrieve clinic details
PATCH  /api/data/clinicas/{id}/     # Update clinic
DELETE /api/data/clinicas/{id}/     # Soft delete clinic
```

**Fields**:
- `id` (UUID): Primary key
- `nombre` (string): Clinic name
- `rut` (string): Chilean tax ID (unique)
- `direccion` (text): Address
- `telefono` (string): Phone number
- `email` (string): Contact email
- `plan` (string): Subscription plan (default: 'basic')
- `activo` (boolean): Active status
- `configuracion` (JSON): Custom settings
- `api_key` (UUID): API key for integrations

#### Institutions - `/api/data/instituciones/`

**Model**: Institucion (icapapi/models.py:33-58)

```
GET    /api/data/instituciones/          # List institutions
POST   /api/data/instituciones/          # Create institution
GET    /api/data/instituciones/{id}/     # Retrieve institution
PATCH  /api/data/instituciones/{id}/     # Update institution
DELETE /api/data/instituciones/{id}/     # Soft delete institution
```

**Fields**:
- `id` (UUID): Primary key
- `clinica_id` (UUID): Foreign key to Clinica
- `codigo` (string): Unique institution code (RBD)
- `nombre` (string): Institution name
- `direccion` (text): Address
- `comuna` (string): Chilean commune
- `region` (string): Chilean region
- `telefono` (string): Phone
- `email` (string): Contact email
- `activo` (boolean): Active status

**Query Filters**:
- `?clinica_id=uuid` - Filter by clinic
- `?activo=true` - Filter by active status
- `?search=text` - Search by name or code

#### Students (Alumnos) - `/api/data/alumnos/`

**Model**: Alumno (icapapi/models.py:98-137)

```
GET    /api/data/alumnos/          # List students
POST   /api/data/alumnos/          # Create student
GET    /api/data/alumnos/{id}/     # Retrieve student
PATCH  /api/data/alumnos/{id}/     # Update student
DELETE /api/data/alumnos/{id}/     # Soft delete student
```

**Fields**:
- `id` (UUID): Primary key
- `clinica_id` (UUID): Clinic ID (for multi-tenancy)
- `institucion_id` (UUID): Foreign key to Institucion
- `rut` (string): Chilean national ID (unique)
- `nombre` (string): First name
- `apellido_paterno` (string): Paternal surname
- `apellido_materno` (string): Maternal surname
- `fecha_nacimiento` (date): Birth date
- `edad` (int): Age (0-120)
- `curso` (string): Grade/class
- `genero` (string): Gender (M/F/O)
- `activo` (boolean): Active status

**Query Filters**:
- `?institucion_id=uuid` - Filter by institution
- `?curso=text` - Filter by grade
- `?search=text` - Search by name or RUT

#### Guardians (Apoderados) - `/api/data/apoderados/`

**Model**: Apoderado (icapapi/models.py:61-95)

```
GET    /api/data/apoderados/          # List guardians
POST   /api/data/apoderados/          # Create guardian
GET    /api/data/apoderados/{id}/     # Retrieve guardian
PATCH  /api/data/apoderados/{id}/     # Update guardian
DELETE /api/data/apoderados/{id}/     # Soft delete guardian
```

**Fields**:
- `id` (UUID): Primary key
- `institucion_id` (UUID): Foreign key to Institucion
- `rut` (string): Chilean national ID (unique)
- `nombre` (string): First name
- `apellido_paterno` (string): Paternal surname
- `apellido_materno` (string): Maternal surname
- `email` (string): Contact email
- `telefono_principal` (string): Primary phone (sensitive)
- `telefono_secundario` (string): Secondary phone
- `consentimiento_informado` (boolean): Consent given
- `fecha_consentimiento` (datetime): Consent date
- `ip_consentimiento` (IP): IP address at consent
- `activo` (boolean): Active status

**Security Note**: Phone numbers are sensitive data and should be encrypted in production.

#### Survey Templates - `/api/data/plantillas-encuesta/`

```
GET    /api/data/plantillas-encuesta/          # List survey templates
POST   /api/data/plantillas-encuesta/          # Create template
GET    /api/data/plantillas-encuesta/{id}/     # Retrieve template
PATCH  /api/data/plantillas-encuesta/{id}/     # Update template
DELETE /api/data/plantillas-encuesta/{id}/     # Delete template
```

#### Surveys (Encuestas) - `/api/data/encuestas/`

```
GET    /api/data/encuestas/          # List surveys
POST   /api/data/encuestas/          # Create survey
GET    /api/data/encuestas/{id}/     # Retrieve survey
PATCH  /api/data/encuestas/{id}/     # Update survey
DELETE /api/data/encuestas/{id}/     # Delete survey
```

**Survey Status Values**:
- `pendiente` - Pending
- `en_progreso` - In Progress
- `completada` - Completed
- `revisada` - Reviewed
- `cancelada` - Cancelled

#### Call Logs - `/api/data/llamadas/`

```
GET    /api/data/llamadas/          # List call logs
POST   /api/data/llamadas/          # Create call log
GET    /api/data/llamadas/{id}/     # Retrieve call log
PATCH  /api/data/llamadas/{id}/     # Update call log
```

**Used for**: ElevenLabs AI-powered call tracking and recordings.

#### Reports (Informes) - `/api/data/informes/`

```
GET    /api/data/informes/          # List reports
POST   /api/data/informes/          # Generate report
GET    /api/data/informes/{id}/     # Retrieve report
DELETE /api/data/informes/{id}/     # Delete report
```

---

## Frontend Integration

### Authentication Flow

The frontend uses the `AuthService` class (src/client/auth-example.ts:69-226) to manage authentication:

1. **Login**: Call `/api/auth/login/` → Store tokens in localStorage + HTTP-only cookies
2. **Auto-refresh**: Token refreshes automatically 5 minutes before expiry
3. **API Requests**: Use `AuthenticatedClient` class for all authenticated requests
4. **Logout**: Clear tokens and redirect to login

**Example Usage**:
```typescript
import { authService, apiClient } from '@client/auth-example'

// Login
const user = await authService.login('username', 'password')

// Make authenticated request
const students = await apiClient.get('/api/data/alumnos/')

// Logout
await authService.logout()
```

### API Client Configuration

All Django API requests are proxied through the Hono server to avoid CORS issues:

- **Environment Variable**: `DJANGO_API_URL` (wrangler.toml:7)
- **Service Layer**: `src/server/services/django-auth.ts`
- **Middleware**: `src/server/middleware/django-auth.ts`

### Multi-Tenant Context

The `djangoClinicContextMiddleware` (src/server/middleware/django-auth.ts) automatically:
1. Validates user's JWT token
2. Extracts `clinica_id` from user profile
3. Sets context variables for all downstream handlers
4. Enforces clinic-level data isolation

**Context Variables**:
```typescript
{
  userId: string          // User ID
  userRole: string        // User role (clinica_admin, etc.)
  clinicaId: string       // Clinic ID for multi-tenancy
  currentUser: UserDetail // Full user object
}
```

---

## Database Schema (PostgreSQL via Django)

All database operations (reads and writes) go through Django REST API.

### Key Tables

- **clinica**: Clinics (top-level tenants)
- **institucion**: Educational institutions
- **alumno**: Students
- **apoderado**: Guardians/parents
- **alumno_apoderado**: Student-guardian relationships
- **disponibilidad_apoderado**: Guardian availability for calls
- **plantilla_encuesta**: Survey templates
- **encuesta**: Surveys
- **encuesta_asignada**: Survey assignments
- **respuesta_encuesta**: Survey responses
- **registro_llamada**: Call logs (ElevenLabs integration)
- **informe_icap**: Generated reports

**Multi-Tenant Filtering**: Django ViewSets automatically filter all queries by the authenticated user's `clinica_id` from their JWT token.

---

## Deployment

### Frontend (Cloudflare Pages)

```bash
# Build
npm run build

# Deploy to production
npm run deploy:production

# Deploy to staging
npm run deploy:staging
```

**Environments**:
- **Development**: Local Vite server (http://localhost:5173)
- **Staging**: Cloudflare Pages (hackathon2-icap-staging.pages.dev)
- **Production**: Cloudflare Pages (hackathon2-icap.pages.dev)

### Backend (Cloudflare Containers)

See `/home/kntor/Documentos/dev/api-psycho/DEPLOYMENT.md` for detailed instructions.

```bash
cd /home/kntor/Documentos/dev/api-psycho

# Configure secrets
wrangler secret put SECRET_KEY
wrangler secret put DB_HOST
wrangler secret put DB_NAME
wrangler secret put DB_USER
wrangler secret put DB_PASSWORD

# Deploy
wrangler deploy

# View logs
wrangler tail
```

---

## Important Security Considerations

### Personal Data Protection (Chilean Law 19.628)

The platform handles sensitive personal data (names, RUT, phone numbers, health information) subject to Chilean privacy laws:

1. **Encryption**: Phone numbers and sensitive data should be encrypted at rest
2. **Consent**: Guardian consent is tracked (`consentimiento_informado`, `fecha_consentimiento`)
3. **Access Logs**: All data access should be logged for audit trails
4. **Data Retention**: Soft deletes (`deleted_at`) preserve audit history

### Multi-Tenant Isolation

**CRITICAL**: Every database query MUST filter by `clinica_id` to prevent cross-tenant data leaks.

**Good Example** (src/server/services/supabase.ts:30-35):
```typescript
let query = supabase.from('alumno').select(`*`)

// Multi-tenant filtering - ALWAYS REQUIRED
if (filters.institucionId) {
  query = query.eq('institucion_id', filters.institucionId)
}
```

**Bad Example** (NEVER DO THIS):
```typescript
// WRONG: Missing clinica_id filter
const { data } = await supabase.from('alumno').select('*')
```

### Role-Based Access Control

Use Django's user roles to enforce permissions:

- **Check role in middleware**: `src/server/middleware/django-auth.ts:58` sets `c.set('userRole', role)`
- **Enforce in routes**: Verify user has sufficient permissions before data operations
- **Hierarchy**: superadmin > clinica_admin > institucion_admin > profesional > agente_ia > readonly

---

## Development Best Practices

### When Adding New Features

1. **Use Django API for ALL data operations**: Authentication, reads, writes, updates, deletes
2. **No direct database access**: Frontend never queries PostgreSQL directly
3. **Trust Django for multi-tenancy**: Django automatically filters by user's `clinica_id`
4. **Check permissions**: Verify user role before allowing operations
5. **Log sensitive actions**: Track who accessed/modified personal data

### File Organization

```
src/
├── client/              # Client-side code (browser)
│   ├── auth-example.ts  # Authentication service
│   └── client.ts        # Client entry point
├── server/              # Server-side code (Cloudflare Pages Functions)
│   ├── routes/          # API route handlers
│   │   ├── auth.ts      # Authentication endpoints
│   │   ├── dashboard.ts # Dashboard data endpoints
│   │   └── students.ts  # Student CRUD endpoints
│   ├── services/        # Business logic
│   │   ├── django-auth.ts    # Django Authentication API client
│   │   ├── django-data.ts    # Django Data API client (CRUD operations)
│   │   └── dashboard-django.ts  # Dashboard analytics via Django
│   ├── middleware/      # Request middleware
│   │   └── django-auth.ts    # JWT validation
│   └── index.tsx        # Main Hono app
└── shared/              # Shared types and utilities
    ├── types/           # TypeScript definitions
    └── utils/           # Utility functions
```

### Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

---

## Troubleshooting

### Authentication Issues

**Problem**: "Token expired" or 401 errors

**Solution**:
1. Check token expiry: Access tokens expire in 1 hour
2. Verify refresh token is being sent
3. Check Django API is reachable
4. Review browser console for errors

### Multi-Tenant Data Leaks

**Problem**: Users seeing data from other clinics

**Solution**:
1. Verify ALL API requests include valid JWT token
2. Check `djangoClinicContextMiddleware` is applied
3. Review Django API ViewSet for proper queryset filtering

### CORS Issues

**Problem**: Browser blocking API requests

**Solution**:
1. Check `CORS_ALLOWED_ORIGINS` in Django settings
2. Verify frontend domain is in allowed origins list
3. Use `credentials: true` for cookie-based auth

---

## External Integrations

### ElevenLabs (Voice Calls)

The platform integrates with ElevenLabs for AI-powered phone calls to guardians:

- **Call Logs**: Stored in `registro_llamada` table
- **Recordings**: Links to ElevenLabs audio files
- **Status Tracking**: Call status and outcomes

### Cloudflare Workers AI (Future)

Planned integration for:
- Survey response analysis
- Automated report generation
- Natural language query interface

---

## Additional Resources

- **Hono Documentation**: https://hono.dev/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/
- **JWT Best Practices**: https://datatracker.ietf.org/doc/html/rfc8725

---

## Project Status

**Current Sprint**: Dashboard Implementation
- ✅ Authentication system (Django JWT integration)
- ✅ Student management CRUD
- ✅ Dashboard API routes
- ⏳ Dashboard UI components (in progress)
- ⏳ Survey management
- ⏳ Call log tracking
- ⏳ Report generation

**Last Updated**: October 2025
