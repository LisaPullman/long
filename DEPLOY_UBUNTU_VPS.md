# Ubuntu VPS Deployment (Docker Compose)

This repo can be deployed on an Ubuntu VPS using Docker Compose.

Notes:
- The default `docker-compose.yml` is for local development (it may expose DB/API ports).
- For a VPS, use `docker-compose.prod.yml` and a host reverse proxy (HTTPS).

## 1) Preflight Checklist (Must Do)

- Do not expose PostgreSQL (`5432`) to the public Internet.
- Do not expose backend API (`3001`) to the public Internet (frontend proxies `/api`).
- Set strong secrets:
  - `POSTGRES_PASSWORD`: strong unique password
  - `JWT_SECRET`: long random string (32+ bytes)
- Firewall: allow `22` (SSH), `80/443` (HTTP/HTTPS); block everything else by default.
- Use HTTPS (Caddy or Nginx on the VPS host).

## 2) Install Docker (Ubuntu)

If you already have Docker + Compose plugin, skip this section.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Install Docker from Docker's official repo (recommended)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

## 3) Configure `.env` (VPS)

Files:
- `docker-compose.prod.yml`
- `.env.prod.example` (copy to `.env`)

```bash
cp .env.prod.example .env
vi .env
```

Minimum required:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`

Recommended:
- Keep `FRONTEND_BIND_ADDR=127.0.0.1` and expose only via HTTPS reverse proxy.
- Keep `TRUST_PROXY=1` if you use Caddy/Nginx, so rate-limit and client IP behave correctly.

## 4) Start (Production Compose)

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

Health checks:
```bash
curl -fsS http://127.0.0.1:${FRONTEND_PORT:-8080}/ >/dev/null && echo "frontend ok"
curl -fsS http://127.0.0.1:${FRONTEND_PORT:-8080}/api >/dev/null && echo "api ok"
```

## 5) Create Your First Account (UI)

In production, demo auto-login is disabled (`VITE_AUTO_LOGIN_DEMO=0` in `docker-compose.prod.yml`).

- Visit `/register` to create an account
- Then `/login`

## 6) Seed (Optional, One-off)

Production should not seed demo data automatically. If you want to seed once:

```bash
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma db seed"
```

Tip:
- Seed uses `DEMO_PASSWORD` for the demo user password (defaults to `demo123456`).

## 7) Reverse Proxy (HTTPS)

In `docker-compose.prod.yml` the frontend binds to `127.0.0.1:${FRONTEND_PORT}` by default, so it is only reachable from the VPS itself.

### Option A: Caddy (Recommended)

`/etc/caddy/Caddyfile`:

```caddyfile
your-domain.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8080
}
```

Reload:
```bash
sudo systemctl reload caddy
```

### Option B: Nginx (Example)

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

Then add TLS (Let’s Encrypt) using your preferred method.

## 8) Firewall (UFW Example)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 9) Ops: Backups, Updates, Logs

Backups (example using `pg_dump` inside container):
```bash
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backups/vanmart-$(date +%F).sql
```

Updates:
```bash
git pull
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
```

Disk/log hygiene:
- Docker logs can grow; `docker-compose.prod.yml` enables basic log rotation.
- Watch disk usage (especially if VPS is small).

## 10) App Security Status (What’s Implemented)

The backend now enforces:
- JWT authentication (`Authorization: Bearer ...` -> `req.user`)
- organizer/owner authorization for key write operations (marts, orders, messages, goods)
- CORS restriction via `CORS_ORIGIN` (optional)
- basic rate limiting for `/api`
- request validation (zod) for key `POST/PUT/PATCH`
