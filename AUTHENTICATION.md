# Authentication System Documentation

Complete guide to the ICAP Survey Platform authentication system using Django REST Framework JWT tokens.

## 🔐 Overview

The authentication system integrates with the **Django OMR API** backend and uses **JSON Web Tokens (JWT)** for secure, stateless authentication.

### Key Features

- ✅ **JWT-based authentication** (djangorestframework-simplejwt)
- ✅ **Multi-tenant isolation** (automatic filtering by `clinica_id`)
- ✅ **Role-based access control** (6 permission levels)
- ✅ **HTTP-only cookies** (XSS protection)
- ✅ **Automatic token refresh** (before 1-hour expiry)
- ✅ **Session management** (login, logout, validation)

---

## 🏗️ Architecture

```
Frontend (Cloudflare Pages + Hono)
  ↓
  POST /api/auth/login
  ↓
Django REST API (api-psycho)
  ↓
  Returns: access_token (1h) + refresh_token (1d)
  ↓
Frontend stores tokens in:
  - HTTP-only cookies (secure)
  - OR localStorage (less secure but easier for dev)
  ↓
Subsequent requests include:
  - Authorization: Bearer <access_token>
  ↓
Django validates token + returns user context
```

---

## 📋 User Roles

| Role | Level | Description | Permissions |
|------|-------|-------------|-------------|
| `superadmin` | 6 | System administrator | ALL data across ALL clinics |
| `clinica_admin` | 5 | Clinic manager | ALL data in their clinic |
| `institucion_admin` | 4 | School administrator | Data for their institution only |
| `profesional` | 3 | Psychologist/Evaluator | Create surveys, view results (if permitted) |
| `agente_ia` | 2 | AI agent system | Automated call operations |
| `readonly` | 1 | View-only access | Read-only within clinic |

---

## 🔑 Authentication Flow

### 1. Login

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "username": "juan.perez",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "username": "juan.perez",
    "email": "juan@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "profesional",
    "role_display": "Profesional/Evaluador",
    "activo": true
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
  "message": "Login successful"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "password": "SecurePassword123!"
  }'
```

**JavaScript Example**:
```javascript
const response = await fetch('http://localhost:5173/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Include cookies
  body: JSON.stringify({
    username: 'juan.perez',
    password: 'SecurePassword123!'
  })
})

const { user, tokens } = await response.json()

// Tokens are automatically stored in HTTP-only cookies
// But you can also store in localStorage for client-side access
localStorage.setItem('access_token', tokens.access)
localStorage.setItem('refresh_token', tokens.refresh)
localStorage.setItem('user', JSON.stringify(user))
```

---

### 2. Register

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "username": "maria.garcia",
  "email": "maria@example.com",
  "password": "SecurePassword123!",
  "password2": "SecurePassword123!",
  "first_name": "María",
  "last_name": "García",
  "role": "profesional",
  "clinica_id": "550e8400-e29b-41d4-a716-446655440000",
  "can_view_sensitive_data": false
}
```

**Response** (201 Created):
```json
{
  "user": { /* Full UserDetail object */ },
  "tokens": {
    "access": "eyJ0eXA...",
    "refresh": "eyJ0eXA..."
  },
  "message": "Usuario registrado exitosamente"
}
```

**Validation Rules**:
- Username: 3-150 characters, alphanumeric + `@.+-_`
- Email: Valid email format
- Password: Minimum 8 characters
- Password2: Must match password
- Role: One of 6 valid roles
- Clinica ID: Valid UUID

---

### 3. Token Refresh

**Endpoint**: `POST /api/auth/refresh`

**Request**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "message": "Token refreshed successfully"
}
```

**Auto-Refresh Example** (Client-side):
```javascript
import { setupTokenRefresh, shouldRefreshToken } from '@shared/utils/token-refresh'

// Setup automatic refresh (checks every minute)
const cleanup = setupTokenRefresh(
  // Get tokens
  () => ({
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token')
  }),
  // Update access token
  (newToken) => {
    localStorage.setItem('access_token', newToken)
  },
  // On refresh failed (redirect to login)
  () => {
    localStorage.clear()
    window.location.href = '/login'
  },
  'http://localhost:5173' // API URL
)

// Cleanup on unmount
// cleanup()
```

---

### 4. Logout

**Endpoint**: `POST /api/auth/logout`

**Request**: No body required

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Effect**: Clears HTTP-only cookies (`access_token`, `refresh_token`)

**JavaScript Example**:
```javascript
await fetch('http://localhost:5173/api/auth/logout', {
  method: 'POST',
  credentials: 'include' // Important for cookies
})

// Clear localStorage too
localStorage.clear()

// Redirect to login
window.location.href = '/login'
```

---

### 5. Validate Token

**Endpoint**: `GET /api/auth/validate`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "juan.perez",
    "role": "profesional",
    "clinica_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Use Case**: Check if current session is still valid before making requests

---

## 👤 User Management

### Get Current User

**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "juan.perez",
  "email": "juan@example.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "is_staff": false,
  "is_active": true,
  "is_superuser": false,
  "date_joined": "2024-01-15T10:30:00Z",
  "profile": {
    "role": "profesional",
    "role_display": "Profesional/Evaluador",
    "clinica_id": "550e8400-e29b-41d4-a716-446655440000",
    "institucion_id": null,
    "is_agent": false,
    "can_view_sensitive_data": false,
    "activo": true,
    "fecha_registro": "2024-01-15T10:30:00Z",
    "ultima_actividad": "2024-01-25T15:45:00Z",
    "configuracion": {}
  },
  "is_superadmin": false,
  "is_clinica_admin": false,
  "is_institucion_admin": false
}
```

---

### Update Profile

**Endpoint**: `PATCH /api/auth/profile`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request**:
```json
{
  "first_name": "Juan Carlos",
  "email": "juancarlos@example.com",
  "can_view_sensitive_data": true
}
```

**Response** (200 OK): Returns updated `UserDetail` object

---

### Change Password

**Endpoint**: `POST /api/auth/change-password`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request**:
```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!",
  "new_password2": "NewSecurePassword456!"
}
```

**Response** (200 OK):
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 🔒 Protected Routes Usage

All routes under `/api/students`, `/api/surveys`, etc. require authentication.

**Example Request**:
```javascript
const response = await fetch('http://localhost:5173/api/students', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include' // If using cookies
})

if (response.status === 401) {
  // Token expired or invalid - try refresh
  const refreshToken = localStorage.getItem('refresh_token')
  // ... refresh logic
}

const students = await response.json()
```

---

## 🛡️ Security Best Practices

### 1. Token Storage

**Option A: HTTP-only Cookies** (Recommended)
```javascript
// Tokens stored in cookies automatically by server
// No client-side JavaScript can access them
// XSS protection built-in
fetch('/api/auth/login', {
  credentials: 'include' // Important!
})
```

**Option B: LocalStorage** (Easier for development)
```javascript
// Store tokens in localStorage
localStorage.setItem('access_token', tokens.access)
localStorage.setItem('refresh_token', tokens.refresh)

// ⚠️ WARNING: Vulnerable to XSS attacks
// Only use in trusted environments
```

### 2. HTTPS Only

**Always use HTTPS in production!**

```javascript
// Production check
if (import.meta.env.PROD && location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`)
}
```

### 3. Token Expiry Handling

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  const accessToken = localStorage.getItem('access_token')

  // Check if token needs refresh
  if (shouldRefreshToken(accessToken)) {
    const refreshToken = localStorage.getItem('refresh_token')
    const newToken = await refreshAccessToken(refreshToken, API_URL)

    if (newToken) {
      localStorage.setItem('access_token', newToken)
      accessToken = newToken
    } else {
      // Refresh failed - redirect to login
      window.location.href = '/login'
      return
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (response.status === 401) {
    // Token invalid - logout
    localStorage.clear()
    window.location.href = '/login'
    return
  }

  return response
}
```

---

## 🧪 Testing Authentication

### Local Development

```bash
# 1. Start Django API (in api-psycho directory)
cd /home/kntor/Documentos/dev/api-psycho
python manage.py runserver

# 2. Start Hono frontend (in hackathon2 directory)
cd /home/kntor/Documentos/dev/hackathon2
npm run dev

# 3. Test login
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test", "password":"test123"}'

# 4. Test protected route
curl http://localhost:5173/api/students \
  -H "Authorization: Bearer <access_token>"
```

### Create Test User (Django)

```bash
cd /home/kntor/Documentos/dev/api-psycho

# Create superuser
python manage.py createsuperuser

# Or create via Django shell
python manage.py shell
```

```python
from django.contrib.auth.models import User
from users.models import UserProfile
from icapapi.models import Clinica

# Create clinic
clinica = Clinica.objects.create(
    nombre="Test Clinic",
    rut="12345678-9",
    email="test@clinic.com"
)

# Create user
user = User.objects.create_user(
    username='testuser',
    email='test@example.com',
    password='testpass123',
    first_name='Test',
    last_name='User'
)

# Create profile
profile = UserProfile.objects.create(
    user=user,
    role='profesional',
    clinica_id=clinica.id,
    can_view_sensitive_data=False,
    activo=True
)
```

---

## 📊 JWT Token Structure

**Access Token Claims**:
```json
{
  "user_id": 1,
  "username": "juan.perez",
  "email": "juan@example.com",
  "role": "profesional",
  "clinica_id": "550e8400-e29b-41d4-a716-446655440000",
  "institucion_id": null,
  "is_agent": false,
  "exp": 1706187600, // Expiry timestamp (1 hour)
  "iat": 1706184000  // Issued at timestamp
}
```

**Token Lifetimes**:
- **Access Token**: 1 hour (3600 seconds)
- **Refresh Token**: 1 day (86400 seconds)

**Refresh Strategy**:
- Refresh token 5 minutes before expiry
- Frontend checks every minute
- Automatic silent refresh

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Token expired or invalid

**Solution**:
```javascript
// Try refreshing the token
const newToken = await refreshAccessToken(refreshToken, API_URL)

if (!newToken) {
  // Redirect to login
  window.location.href = '/login'
}
```

### Issue: CORS Error

**Cause**: Missing credentials or incorrect origin

**Solution**:
```javascript
fetch(url, {
  credentials: 'include', // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Issue: 403 Forbidden

**Cause**: User doesn't have permission for that resource

**Solution**: Check user role and clinic association

```javascript
// Get current user to verify permissions
const user = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json())

console.log(user.profile.role) // Check role
console.log(user.profile.clinica_id) // Check clinic
```

---

## 📚 Related Documentation

- [API Documentation (Django)](/home/kntor/Documentos/dev/api-psycho/API_DOCUMENTATION.md)
- [README (Frontend)](/home/kntor/Documentos/dev/hackathon2/README.md)
- [Django REST Framework SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)

---

## 🔄 Migration from Old System

If you were using the old Supabase-only auth:

### Before (Supabase Auth):
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### After (Django JWT):
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user',
    password: 'password'
  })
})

const { tokens, user } = await response.json()
localStorage.setItem('access_token', tokens.access)
```

---

## ✅ Authentication Checklist

For new features:

- [ ] Check if route needs authentication
- [ ] Add `djangoAuthMiddleware` if protected
- [ ] Add `djangoClinicContextMiddleware` for multi-tenant routes
- [ ] Handle 401 errors (token expired)
- [ ] Handle 403 errors (insufficient permissions)
- [ ] Implement automatic token refresh
- [ ] Test with different user roles
- [ ] Verify multi-tenant isolation
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags

---

**Last Updated**: January 25, 2025
**Version**: 1.0.0
