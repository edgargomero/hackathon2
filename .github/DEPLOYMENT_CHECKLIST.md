# Deployment Checklist ✅

Usa este checklist antes de tu primer deployment a producción.

## Pre-Deployment Setup (Una sola vez)

### 1. Cloudflare Account Setup
- [ ] Crear cuenta en Cloudflare (si no existe)
- [ ] Verificar que tienes acceso a Cloudflare Pages
- [ ] Obtener Account ID del dashboard

### 2. Crear Proyectos en Cloudflare Pages
- [ ] Crear proyecto `hackathon2-icap` (production)
  - Branch: `main`
  - Build command: `npm run build`
  - Output directory: `dist`
- [ ] Crear proyecto `hackathon2-icap-staging` (staging)
  - Branch: `staging`
  - Build command: `npm run build`
  - Output directory: `dist`

### 3. Generar Cloudflare API Token
- [ ] Ir a https://dash.cloudflare.com/profile/api-tokens
- [ ] Crear token con permisos:
  - Account - Cloudflare Pages - Edit
- [ ] Copiar y guardar el token de forma segura

### 4. Configurar GitHub Secrets
- [ ] Ir a Settings → Secrets and variables → Actions
- [ ] Agregar `CLOUDFLARE_API_TOKEN`
- [ ] Agregar `CLOUDFLARE_ACCOUNT_ID`

### 5. Configurar Environment Variables en Cloudflare Pages

#### Production (`hackathon2-icap`)
- [ ] DJANGO_API_URL = `https://api-psycho.workers.dev` (o tu URL)
- [ ] SUPABASE_URL = `https://qetwmgvlqzevksqnhruz.supabase.co`
- [ ] NODE_ENV = `production`
- [ ] SUPABASE_SERVICE_ROLE_KEY = `[encrypted secret]`
- [ ] DJANGO_API_KEY = `[encrypted secret]`

#### Staging (`hackathon2-icap-staging`)
- [ ] DJANGO_API_URL = `https://api-psycho-staging.workers.dev` (o tu URL)
- [ ] SUPABASE_URL = `https://qetwmgvlqzevksqnhruz.supabase.co`
- [ ] NODE_ENV = `staging`
- [ ] SUPABASE_SERVICE_ROLE_KEY = `[encrypted secret]`
- [ ] DJANGO_API_KEY = `[encrypted secret]`

### 6. Verificar Configuración Local
- [ ] Archivo `wrangler.toml` configurado correctamente
- [ ] Archivo `.github/workflows/deploy.yml` existe
- [ ] `.gitignore` incluye archivos sensibles (.env, .dev.vars)

## First Deployment

### 1. Test Local
- [ ] Ejecutar `npm run dev` y verificar que funciona
- [ ] Ejecutar `npm run build` sin errores
- [ ] Ejecutar `npx tsc --noEmit` sin errores de tipos

### 2. Create Staging Branch
```bash
git checkout -b staging
git push origin staging
```
- [ ] Crear branch `staging` y hacer push
- [ ] Verificar que GitHub Actions se ejecuta
- [ ] Verificar deployment en Cloudflare Pages

### 3. Test Staging Environment
- [ ] Acceder a URL de staging (ej: `https://hackathon2-icap-staging.pages.dev`)
- [ ] Verificar que la página carga correctamente
- [ ] Probar login con Django API
- [ ] Verificar conexión con Supabase
- [ ] Probar navegación entre páginas

### 4. Deploy to Production
```bash
git checkout main
git merge staging
git push origin main
```
- [ ] Merge staging → main
- [ ] Verificar GitHub Actions deployment
- [ ] Verificar deployment en Cloudflare Pages

### 5. Test Production Environment
- [ ] Acceder a URL de production (ej: `https://hackathon2-icap.pages.dev`)
- [ ] Verificar que la página carga correctamente
- [ ] Probar autenticación
- [ ] Verificar dashboard con datos reales
- [ ] Probar todas las funcionalidades críticas

### 6. Configure Custom Domain (Opcional)
- [ ] Agregar dominio custom en Cloudflare Pages
- [ ] Verificar SSL certificate (automático)
- [ ] Actualizar DNS records
- [ ] Probar acceso con dominio custom

## Post-Deployment

### 1. Documentation
- [ ] Actualizar README.md con URLs de producción
- [ ] Documentar credenciales en password manager
- [ ] Compartir URLs con el equipo

### 2. Monitoring Setup
- [ ] Configurar alertas en Cloudflare (opcional)
- [ ] Verificar logs en GitHub Actions
- [ ] Verificar analytics en Cloudflare Pages

### 3. Security Review
- [ ] Verificar que no hay secretos en el código
- [ ] Verificar que CORS está configurado correctamente
- [ ] Verificar que autenticación funciona
- [ ] Verificar que multi-tenancy está aislado

## Regular Maintenance

### Weekly
- [ ] Revisar logs de errores en GitHub Actions
- [ ] Revisar analytics de Cloudflare Pages

### Monthly
- [ ] Revisar y actualizar dependencias (`npm outdated`)
- [ ] Verificar que los secrets siguen siendo válidos
- [ ] Review de seguridad

### Quarterly
- [ ] Rotar Cloudflare API Token
- [ ] Actualizar secret en GitHub
- [ ] Review completo de seguridad

## Troubleshooting Quick Links

- [GitHub Actions Workflows](../../actions)
- [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
- [Deployment Guide](../../DEPLOYMENT.md)
- [README](../../README.md)

## Emergency Rollback

Si algo sale mal en producción:

1. **Opción rápida**: Rollback en Cloudflare Dashboard
   - Workers & Pages → hackathon2-icap → Deployments
   - Seleccionar deployment anterior → Rollback

2. **Opción Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Contactar equipo** si el problema persiste

---

**Fecha de creación**: Octubre 2025
**Última actualización**: Octubre 2025
**Responsable**: [Tu nombre/equipo]
