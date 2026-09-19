# ✅ MON 21 Set 09:00 UTC — Smoke Test Checklist BLINDADO

**Status**: LOCKED IN  
**Executado por**: @qa (Quinn)  
**Aprovação**: Go/No-Go para produção  
**Timeline**: MON 21 09:00 - 10:30 UTC (90 min)

---

## ANTES DE COMEÇAR (5 min)

- [ ] Render dashboard aberto: https://dashboard.render.com/services/ctrl-alt-news-portal
- [ ] Sentry dashboard aberto: https://sentry.io/organizations/[org]/issues/
- [ ] Google Analytics aberto: https://analytics.google.com
- [ ] Browser console limpo (F12 → Console)
- [ ] Render logs acessível (Dashboard → Logs tab)
- [ ] Slack #production pronto para comunicados

---

## TESTE #1: Health Endpoint (5 min)

**Objetivo**: Verificar que o servidor está rodando e saudável

```bash
# Executar
curl -s https://ctrl-alt-news-portal.onrender.com/health | jq .

# Esperado
{
  "status": "ok",
  "timestamp": "2026-09-21T09:05:30Z",
  "uptime": 3600,
  "memory": { ... }
}

# Checklist
- [ ] HTTP 200 response
- [ ] status: "ok" (not "degraded" or "unhealthy")
- [ ] timestamp present and valid
- [ ] uptime > 0
- [ ] memory.process.heapUsed < 80% of heapTotal
```

**Se falhar**:
- [ ] Verificar Render logs (Dashboard → Logs)
- [ ] Se 502/503: server crashed → trigger rollback
- [ ] Se timeout: database offline → check PostgreSQL status
- [ ] Documentar erro exacto

---

## TESTE #2: Login com Google OAuth (10 min)

**Objetivo**: Verificar autenticação funciona end-to-end

1. **Abrir staging no browser**
   ```
   https://ctrl-alt-news-portal.onrender.com
   ```
   - [ ] Page loads in < 3 seconds
   - [ ] No console errors (F12 → Console)
   - [ ] "Login" button visible

2. **Clicar em Login**
   - [ ] Google OAuth popup aparece
   - [ ] Popup is responsive (< 2s)

3. **Usar conta de teste** (registre credenciais em docs/deployment/)
   - [ ] Login email: [TEST_EMAIL]
   - [ ] Password: [TEST_PASSWORD]
   - [ ] Redirect back to app

4. **Verificar pós-login**
   - [ ] User name appears in header
   - [ ] User profile accessible
   - [ ] No 401/403 errors in logs
   - [ ] Sentry: 0 auth errors

**Se falhar**:
- [ ] Check Google OAuth config in Render env vars
- [ ] Verify JWT_SECRET is set
- [ ] Check Sentry for auth exceptions
- [ ] Documentar erro

---

## TESTE #3: Ler Artigo (10 min)

**Objetivo**: Verificar fluxo de conteúdo crítico

1. **Homepage carrega**
   - [ ] All article cards visible
   - [ ] Images loading (< 2s each)
   - [ ] No 404 on assets

2. **Clicar em um artigo**
   - [ ] Article detail page loads (< 3s)
   - [ ] Title, content, author visible
   - [ ] Images render properly

3. **Verificar analytics**
   - [ ] Google Analytics tracking (check Network tab: collect?v=...)
   - [ ] No console errors

4. **Check related content**
   - [ ] "Related articles" section loads
   - [ ] No infinite loading

**Se falhar**:
- [ ] Check database connectivity (Render logs)
- [ ] Verify DATABASE_URL in env vars
- [ ] Check for query timeouts (> 1s)
- [ ] Sentry: log any exceptions

---

## TESTE #4: Postar Comentário (10 min)

**Objetivo**: Verificar escrita de dados e notificações

1. **Na página de artigo, abrir seção de comentários**
   - [ ] Comment form visible
   - [ ] Text input responsive

2. **Escrever comentário de teste**
   ```
   "QA Test comment - " + new Date().toISOString()
   ```
   - [ ] Input accepts text
   - [ ] Submit button clickable

3. **Submeter comentário**
   - [ ] Form submits (< 2s)
   - [ ] Comment appears in list imediatamente
   - [ ] No 400/500 errors

4. **Verificar notificação** (se autor está logado)
   - [ ] Author recebe notificação
   - [ ] Email enviado (check Render logs para email service)

5. **Database check**
   - [ ] Comentário salvo no DB (pode verificar backend logs)
   - [ ] Nenhum erro de constraint violation

**Se falhar**:
- [ ] Check email service credentials
- [ ] Verify database write permissions
- [ ] Check for RLS policy issues (Supabase)
- [ ] Sentry: log exception
- [ ] Documentar erro

---

## TESTE #5: Performance Check (10 min)

**Objetivo**: Verificar velocidade não degradou

| Métrica | Alvo | Método |
|---------|------|--------|
| **Page Load** | < 3s | Chrome DevTools → Lighthouse |
| **API Response** | < 200ms | Network tab → /api/articles |
| **Database Query** | < 100ms | Render logs → query duration |
| **Memory Usage** | < 80% | Health endpoint → heap |

**Executar Lighthouse**:
1. Open DevTools (F12)
2. Lighthouse tab
3. Run audit (Mobile + Desktop)
4. Check scores:
   - [ ] Performance > 80
   - [ ] LCP (Largest Contentful Paint) < 3s
   - [ ] FID (First Input Delay) < 100ms

**Network tab checks**:
- [ ] Largest request < 500KB
- [ ] Total page < 2MB
- [ ] No failed requests (404, 500)

**Sentry performance**:
- [ ] No "slow" warnings
- [ ] Transaction times reasonable

**Se performance degradada**:
- [ ] Check Render resource usage (CPU, memory)
- [ ] Analyze slow queries in Sentry
- [ ] Check if new code introduced bottleneck
- [ ] Documentar achados

---

## TESTE #6: Error Checking (10 min)

**Objetivo**: Verificar que erros são capturados e reportados

1. **Browser Console (F12 → Console)**
   - [ ] No red error messages
   - [ ] No 401/403 warnings
   - [ ] No XSS warnings

2. **Render Logs**
   ```
   Dashboard → Logs tab
   ```
   - [ ] Search for "ERROR"
   - [ ] Search for "WARN"
   - [ ] Search for "CRITICAL"
   - [ ] No unexpected exceptions
   - [ ] All errors are expected (e.g., 404 on missing images = ok)

3. **Sentry Dashboard**
   - [ ] 0 new "CRITICAL" issues
   - [ ] Error rate < 0.1%
   - [ ] No spike in errors last 30 min

4. **Try to trigger errors (optionally)**
   - [ ] Send malformed request: `curl https://...?invalid=param`
   - [ ] Verify error is caught (not 500 crash)
   - [ ] Error appears in Sentry

**If errors found**:
- [ ] Screenshot + timestamp
- [ ] Note error message
- [ ] Determine: critical vs acceptable
- [ ] Log in Sentry

---

## TEST #7: Database Connectivity (5 min)

**Objetivo**: Verificar que DB está saudável

1. **Check Render Dashboard**
   - [ ] PostgreSQL service shows "Running"
   - [ ] Database tab shows connections < max limit

2. **Health endpoint includes DB status**
   - [ ] `/health` response includes database.status = "ok"
   - [ ] Or includes database.latency < 100ms

3. **Query from app works**
   - [ ] Login test (TESTE #2) succeeded → DB readable
   - [ ] Comment test (TESTE #4) succeeded → DB writable

**If database issues**:
- [ ] Check connection string in Render env vars
- [ ] Verify PostgreSQL service running
- [ ] Check connection pool exhaustion (Render metrics)
- [ ] If down: trigger **IMMEDIATE ROLLBACK**

---

## FINAL VERDICT (5 min)

**Compilar resultados**:

```markdown
## SMOKE TEST RESULTS — 2026-09-21

**Overall Status**: ✅ PASS / ❌ FAIL

### Test Summary
| Test | Result | Issues |
|------|--------|--------|
| Health Endpoint | ✅ | — |
| OAuth Login | ✅/❌ | — |
| Article Read | ✅/❌ | — |
| Comment Post | ✅/❌ | — |
| Performance | ✅/❌ | — |
| Error Check | ✅/❌ | — |
| Database | ✅/❌ | — |

### Critical Issues (if any)
- [ ] None
- [ ] Issue #1: [description]
- [ ] Issue #2: [description]

### Recommendation
- ✅ APPROVED — All tests pass, ready for WED decision
- ❌ BLOCKED — Critical issues found, needs fixes before decision
```

---

## IF TESTS FAIL — Escalation Procedure

**Priority 1 (Server Down)**:
1. Check Render logs immediately
2. If error is clear and fixable: notify @dev
3. If unclear: trigger ROLLBACK now
4. Document in Slack #production

**Priority 2 (Feature Broken)**:
1. Reproduce error
2. Screenshot + timestamp
3. Check Sentry for clue
4. Create QA_FIX_REQUEST.md
5. Notify @dev

**Priority 3 (Performance Issue)**:
1. Benchmark baseline (before change)
2. Identify slow endpoint
3. Notify @dev for optimization
4. Continue monitoring

---

## Timing

| Time | Action |
|------|--------|
| **09:00** | Start smoke test |
| **09:30** | Halfway point — check progress |
| **09:50** | Compile results |
| **10:00** | Report findings to team |
| **10:30** | **DECISION**: Ready for WED 23 decision, or needs fixes |

---

## Communication Template

**If PASS**:
```
✅ SMOKE TEST PASSED
- All 7 tests successful
- No critical issues
- Performance meets targets
- Ready for WED 23 Go/No-Go decision
```

**If FAIL**:
```
❌ SMOKE TEST ISSUES FOUND
- [List critical issues]
- Blocking: [which feature]
- Needs: [@dev to fix]
- Re-test: [when]
```

---

**Created**: FRI 19 Sep 2026  
**For**: MON 21 Sep 2026  
**By**: DevOps (Gage) + QA (Quinn)  
**Status**: READY TO EXECUTE
