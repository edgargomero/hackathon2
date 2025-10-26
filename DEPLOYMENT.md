# Deployment Guide - Cloudflare Pages

Esta guía explica cómo desplegar el frontend ICAP Survey Platform en **Cloudflare Pages** con CI/CD automático.

## 🎯 Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────┐
│              GitHub Repository                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │   main   │  │ staging  │  │  PRs     │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
└───────┼────────────┼──────────────┼────────────────┘
        │            │              │
        │ Push       │ Push         │ Pull Request
        ▼            ▼              ▼
┌───────────────────────────────────────────────────┐
│         GitHub Actions (CI/CD)                    │
│  ┌──────────────────────────────────────┐        │
│  │  1. Quality Checks                   │        │
│  │     - TypeScript type check          │        │
│  │     - ESLint                          │        │
│  └──────────────────────────────────────┘        │
│  ┌──────────────────────────────────────┐        │
│  │  2. Build                             │        │
│  │     - npm ci                          │        │
│  │     - npm run build                   │        │
│  └──────────────────────────────────────┘        │
│  ┌──────────────────────────────────────┐        │
│  │  3. Deploy to Cloudflare Pages       │        │
│  └──────────────────────────────────────┘        │
└───────────┬───────────────┬──────────────┬────────┘
            │               │              │
            ▼               ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Production   │ │  Staging     │ │  Preview     │
    │  (main)      │ │  (staging)   │ │  (PR)        │
    └──────────────┘ └──────────────┘ └──────────────┘
    hackathon2-icap  hackathon2-icap  Temporary URL
                     -staging
```

## 📋 Requisitos Previos

1. **Cuenta de Cloudflare** con acceso a Cloudflare Pages
2. **Repositorio GitHub** del proyecto
3. **Node.js 20+** instalado localmente para testing

## 🚀 Configuración Inicial (Una sola vez)

### 1. Crear Proyectos en Cloudflare Pages

#### Proyecto de Producción

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
2. Click en **Create application** → **Pages** → **Connect to Git**
3. Selecciona el repositorio GitHub
4. Configuración del build:
   ```
   Project name: hackathon2-icap
   Production branch: main
   Build command: npm run build
   Build output directory: dist
   ```
5. Click **Save and Deploy**

#### Proyecto de Staging

1. Repite el proceso anterior con:
   ```
   Project name: hackathon2-icap-staging
   Production branch: staging
   Build command: npm run build
   Build output directory: dist
   ```

### 2. Obtener Credenciales de Cloudflare

#### a) Cloudflare API Token

1. Ve a [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token** → **Custom Token**
3. Configuración:
   ```
   Token name: GitHub Actions - ICAP Frontend

   Permissions:
   - Account - Cloudflare Pages - Edit
   - Account - Workers Scripts - Edit (opcional)

   Account Resources:
   - Include - Your Account

   Zone Resources:
   - Include - All zones (o específico si prefieres)
   ```
4. Click **Continue to summary** → **Create Token**
5. **COPIA EL TOKEN** (solo se muestra una vez)

#### b) Cloudflare Account ID

1. Ve al [Dashboard de Cloudflare](https://dash.cloudflare.com/)
2. Selecciona cualquier sitio
3. En la barra lateral derecha, encontrarás **Account ID**
4. Copia el ID (formato: `abc123def456...`)

### 3. Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Agrega estos secrets:

| Secret Name | Valor | Dónde obtenerlo |
|-------------|-------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Tu token de API | Paso 2.a |
| `CLOUDFLARE_ACCOUNT_ID` | Tu Account ID | Paso 2.b |

**Importante**: `GITHUB_TOKEN` es automático, no necesitas crearlo.

### 4. Configurar Variables de Entorno en Cloudflare Pages

Para cada proyecto (Production y Staging), configura las variables de entorno:

1. Ve a **Workers & Pages** → Selecciona el proyecto
2. **Settings** → **Environment variables**
3. Agrega las siguientes variables:

#### Production (`hackathon2-icap`)

```
DJANGO_API_URL=https://api-psycho.edgar-gomero.workers.dev
SUPABASE_URL=https://qetwmgvlqzevksqnhruz.supabase.co
NODE_ENV=production
```

#### Staging (`hackathon2-icap-staging`)

```
DJANGO_API_URL=https://api-psycho.edgar-gomero.workers.dev
SUPABASE_URL=https://qetwmgvlqzevksqnhruz.supabase.co
NODE_ENV=staging
```

**Secrets** (marcados como encrypted):
- `SUPABASE_SERVICE_ROLE_KEY`: Tu service role key de Supabase
- `DJANGO_API_KEY`: e8fdefc3922210c44f84336609eac8675656b6d8c662054303ee575e106e647d

> **⚠️ Nota de Seguridad**: El `DJANGO_API_KEY` mostrado arriba debe configurarse como variable de entorno **encrypted** en Cloudflare Pages Dashboard, NO como variable pública.

## 🔄 Flujo de CI/CD

### Deployment Automático

El workflow de GitHub Actions se ejecuta automáticamente en estos casos:

#### 1. **Push a `main`** → Production Deployment
```bash
git push origin main
```

Flujo:
1. ✅ Quality checks (TypeScript, Linting)
2. ✅ Build del proyecto
3. ✅ Deploy a `hackathon2-icap` (production)
4. ✅ URL: `https://hackathon2-icap.pages.dev`

#### 2. **Push a `staging`** → Staging Deployment
```bash
git push origin staging
```

Flujo:
1. ✅ Quality checks
2. ✅ Build del proyecto
3. ✅ Deploy a `hackathon2-icap-staging`
4. ✅ URL: `https://hackathon2-icap-staging.pages.dev`

#### 3. **Pull Request a `main`** → Preview Deployment
```bash
# Crear PR en GitHub
```

Flujo:
1. ✅ Quality checks
2. ✅ Build del proyecto
3. ✅ Deploy a URL temporal de preview
4. ✅ Comentario automático en el PR con la URL
5. ✅ URL: `https://abc123.hackathon2-icap.pages.dev`

### Deployment Manual

Si necesitas desplegar manualmente:

```bash
# Production
npm run deploy:production

# Staging
npm run deploy:staging
```

**Requisito**: Debes tener Wrangler configurado localmente:
```bash
npx wrangler login
```

## 📊 Monitoreo de Deployments

### Ver Logs de GitHub Actions

1. Ve a tu repositorio → **Actions**
2. Selecciona el workflow run
3. Click en el job para ver logs detallados

### Ver Deployments en Cloudflare

1. Ve a **Workers & Pages** → Selecciona el proyecto
2. **View details** → **Deployments**
3. Puedes ver:
   - Estado del deployment
   - Logs de build
   - Preview del sitio
   - Rollback a versiones anteriores

## 🔍 Troubleshooting

### Error: "Build failed - Type errors"

**Problema**: TypeScript encuentra errores de tipos

**Solución**:
```bash
# Ejecutar localmente
npx tsc --noEmit

# Corregir los errores antes de hacer push
```

### Error: "API Token invalid"

**Problema**: Token de Cloudflare expirado o inválido

**Solución**:
1. Genera un nuevo token en Cloudflare
2. Actualiza el secret `CLOUDFLARE_API_TOKEN` en GitHub

### Error: "Project not found"

**Problema**: El nombre del proyecto no coincide

**Solución**: Verifica que el `projectName` en `.github/workflows/deploy.yml` coincida con el nombre en Cloudflare Pages

### Preview Deployment No Comenta en PR

**Problema**: El bot no comenta la URL de preview

**Solución**: Verifica que el workflow tenga permisos:
```yaml
permissions:
  pull-requests: write
```

## 🌐 Custom Domains

### Agregar Dominio Personalizado

1. Ve a tu proyecto en Cloudflare Pages
2. **Custom domains** → **Set up a custom domain**
3. Ingresa tu dominio (ej: `app.icap.cl`)
4. Cloudflare configurará automáticamente:
   - DNS records
   - SSL certificate (automático)
   - Redirects HTTP → HTTPS

### Dominios Recomendados

```
Production:  app.icap.cl
Staging:     staging.icap.cl
```

## 🔐 Seguridad

### Best Practices

1. **Nunca commits secretos** al repositorio
   - ✅ Usa GitHub Secrets
   - ✅ Usa Cloudflare Environment Variables
   - ❌ No hagas commit de `.env`

2. **Rotación de tokens**
   - Rota el API token cada 90 días
   - Actualiza el secret en GitHub

3. **Permisos mínimos**
   - El API token solo debe tener permisos de Cloudflare Pages
   - No uses tu API key global

4. **Review de PRs**
   - Revisa los preview deployments antes de merge
   - Verifica que no haya data sensible expuesta

## 🧪 Testing Pre-Deployment

Antes de hacer push, ejecuta localmente:

```bash
# 1. Type checking
npx tsc --noEmit

# 2. Linting
npm run lint

# 3. Build
npm run build

# 4. Preview local del build
npm run preview
```

## 📈 Estrategia de Branching

```
main (production)
  ↑
  │ merge PR
  │
staging (testing)
  ↑
  │ merge PR
  │
feature/* (development)
```

**Workflow recomendado**:

1. Crea feature branch: `git checkout -b feature/dashboard`
2. Desarrolla y commitea cambios
3. Push y crea PR a `staging`: `git push origin feature/dashboard`
4. Revisa preview deployment en el PR
5. Merge a `staging` → Deploy automático a staging
6. Prueba en staging
7. Crea PR de `staging` → `main`
8. Merge → Deploy automático a production

## 🚦 Rollback

Si necesitas revertir un deployment:

### Opción 1: Rollback en Cloudflare Dashboard

1. Ve a **Deployments**
2. Encuentra el deployment anterior estable
3. Click **Rollback to this deployment**

### Opción 2: Git Revert

```bash
# Revertir el último commit
git revert HEAD

# Push para trigger nuevo deployment
git push origin main
```

### Opción 3: Rollback a Commit Específico

```bash
# Identificar el commit estable
git log --oneline

# Revertir a ese commit
git revert <commit-hash>

# Push
git push origin main
```

## 📚 Recursos Adicionales

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages GitHub Action](https://github.com/cloudflare/pages-action)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Hono Deployment Guide](https://hono.dev/getting-started/cloudflare-pages)

## 🤝 Soporte

Si encuentras problemas:

1. Revisa los logs en GitHub Actions
2. Revisa los logs en Cloudflare Pages
3. Verifica que todos los secrets estén configurados
4. Consulta la documentación oficial

---

**Estado**: CI/CD Configurado ✅
**Última actualización**: Octubre 2025
**Próximo review**: Enero 2026
