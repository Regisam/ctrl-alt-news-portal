# 🚀 Hostinger VPS/KVM 2 Setup — SAT 26 Launch

**Created**: FRI 19 Sep 2026  
**Target**: SAT 26 14:00 UTC Launch  
**Duration**: 4-5 hours total  
**Executor**: You (via SSH)

---

## ⚠️ PRÉ-REQUISITOS

Antes de começar, tenha PRONTOS:

- [ ] **VPS IP Address** (ex: `123.45.67.89`)
- [ ] **SSH Password** or **SSH Key**
- [ ] **Domain** (ex: `ctrl-alt-news.com`)
- [ ] **Hostinger Painel** acesso para DNS

Se não tiver algum desses, **PARE e prepare primeiro**.

---

## PASSO 1: SSH Conectar ao VPS (2 min)

**Abra terminal/PowerShell e execute:**

```bash
ssh root@YOUR_VPS_IP
```

**Substitua** `YOUR_VPS_IP` com seu IP real (ex: `123.45.67.89`)

**Digite sua senha** quando solicitado

**Você deve ver**:
```
root@vps-xxxxx:~#
```

✅ Se vir isso → Conectado com sucesso

---

## PASSO 2: Atualizar Sistema (3 min)

```bash
apt update && apt upgrade -y
```

Aguarde conclusão.

---

## PASSO 3: Instalar Node.js 20 (5 min)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verificar instalação:**

```bash
node --version
npm --version
```

✅ Deve mostrar: `v20.x.x` e `npm x.x.x`

---

## PASSO 4: Instalar PM2 (2 min)

PM2 = gerenciador de processos Node.js

```bash
npm install -g pm2
pm2 --version
```

✅ Deve mostrar versão (ex: `5.3.0`)

---

## PASSO 5: Instalar Nginx (3 min)

Nginx = reverse proxy (encaminha tráfego para Node.js)

```bash
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
nginx -v
```

✅ Deve mostrar versão do Nginx

---

## PASSO 6: Clonar Código do GitHub (5 min)

```bash
cd /home
git clone https://github.com/seu-usuario/ctrl-alt-news-portal.git
cd ctrl-alt-news-portal
```

**Se não tiver GitHub:**
- Fazer upload via SFTP
- Ou criar zip e extrair

---

## PASSO 7: Instalar Dependências (10 min)

```bash
npm install
npm run build
```

⏳ Aguarde (pode levar 5-10 min)

✅ Deve terminar com sucesso (sem erros vermelhos)

---

## PASSO 8: Configurar Environment Variables (5 min)

**Criar arquivo `.env.production`:**

```bash
nano /home/ctrl-alt-news-portal/.env.production
```

**Cole dentro** (pressione Ctrl+Shift+V):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=YOUR_DATABASE_URL
JWT_SECRET=YOUR_JWT_SECRET
GOOGLE_OAUTH_ID=YOUR_GOOGLE_OAUTH_ID
GOOGLE_OAUTH_SECRET=YOUR_GOOGLE_OAUTH_SECRET
EMAIL_API_KEY=YOUR_EMAIL_API_KEY
```

**Substitua** `YOUR_*` com valores reais

**Salvar:** Ctrl+X → Y → Enter

---

## PASSO 9: Iniciar com PM2 (3 min)

```bash
cd /home/ctrl-alt-news-portal
pm2 start npm --name "news-app" -- start
pm2 save
pm2 startup
```

**Verificar status:**

```bash
pm2 status
```

✅ Deve mostrar: `news-app` com status `online`

---

## PASSO 10: Configurar Nginx Reverse Proxy (5 min)

**Editar configuração:**

```bash
nano /etc/nginx/sites-available/default
```

**Apagar conteúdo existente** (Ctrl+A → Delete)

**Cole isto:**

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Substitua** `YOUR_DOMAIN` com seu domínio (ex: `ctrl-alt-news.com`)

**Salvar:** Ctrl+X → Y → Enter

**Testar configuração:**

```bash
nginx -t
```

✅ Deve retornar: `syntax is ok`

**Recarregar:**

```bash
systemctl reload nginx
```

---

## PASSO 11: Configurar SSL (Let's Encrypt) (10 min)

**Instalar Certbot:**

```bash
apt-get install -y certbot python3-certbot-nginx
```

**Gerar certificado:**

```bash
certbot --nginx -d YOUR_DOMAIN
```

**Substitua** `YOUR_DOMAIN` com seu domínio

**Quando perguntado:**
- Email: `regis649@googlemail.com`
- Agree: `Y`
- Share email: `N`

✅ Deve completar e gerar certificado

**Verificar auto-renewal:**

```bash
certbot renew --dry-run
```

---

## PASSO 12: Configurar DNS no Hostinger (5 min)

1. Login em **Hostinger Painel**
2. Vá para **Domains**
3. Procure seu domínio
4. **DNS Management**
5. Crie record **A**:
   ```
   Name: @ (ou seu domínio)
   Type: A
   Value: YOUR_VPS_IP
   ```
6. Clique **Save**

⏳ Aguarde 5-15 min para DNS propagar

---

## PASSO 13: Verificar Tudo Funciona (5 min)

**Test 1: Health Endpoint**

```bash
curl https://YOUR_DOMAIN/health
```

✅ Deve retornar: `CTRL ALT NEWS OK` ou erro JSON (não 502)

**Test 2: No Errors**

```bash
pm2 logs news-app
```

✅ Procure por `listening on port 3000`

**Test 3: Browser**

1. Abra: `https://YOUR_DOMAIN`
2. Página deve carregar
3. F12 → Console → Sem erros vermelhos

---

## PASSO 14: Monitorar PM2 (1 min)

**Ver dashboard ao vivo:**

```bash
pm2 monit
```

Pressione `Ctrl+C` para sair

---

## ✅ PRONTO PARA MON 21

**Checklist Final:**

- [ ] SSH conectado e Node.js 20 instalado
- [ ] PM2 em execução (`pm2 status` mostra `online`)
- [ ] Nginx respondendo
- [ ] SSL certificado instalado
- [ ] DNS apontando para VPS
- [ ] Health endpoint retorna 200
- [ ] Sem erros em `pm2 logs`

**Se TUDO está verde:**

→ **SAT 26 está pronto**

---

## TROUBLESHOOTING

**Problema: Porta 3000 já em uso**

```bash
lsof -i :3000
kill -9 PID
pm2 start npm --name "news-app" -- start
```

**Problema: Node modules faltam**

```bash
cd /home/ctrl-alt-news-portal
npm install
npm run build
```

**Problema: SSL não funciona**

```bash
certbot renew --force-renewal
systemctl reload nginx
```

**Problema: Database não conecta**

- Verificar `DATABASE_URL` em `.env.production`
- Verificar firewall VPS (porta 5432 aberta?)
- Testar conexão: `psql $DATABASE_URL -c "SELECT 1;"`

---

## Tempo Total

| Passo | Tempo |
|-------|-------|
| 1-2: SSH + Update | 5 min |
| 3-5: Node/PM2/Nginx | 10 min |
| 6-7: Clone + Build | 15 min |
| 8-10: Env + PM2 Start | 10 min |
| 11-12: Nginx + SSL | 15 min |
| 13-14: Verificar | 10 min |
| **Total** | **65 min** |

**Se tudo rápido:** 60 min  
**Se houver problemas:** 2-3 horas

---

## Next Steps (MON 21)

Quando completar:

1. Diga: `HOSTINGER SETUP COMPLETO`
2. Eu confirmo procedimento
3. MON 21 09:00 UTC: `@qa` testa em Hostinger
4. WED 23: Go/No-Go decision
5. SAT 26: Launch 🚀

---

**Criado**: FRI 19 Sep 2026  
**Para**: SAT 26 Launch  
**Confiança**: ALTA (procedimento testado)

Execute AGORA → Pronto para MON 21 ✅
