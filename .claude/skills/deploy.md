---
name: deploy
description: Deploy ForFor to Hetzner server. Use when deployment issues arise or when manually deploying.
---

# Deploy ForFor to Hetzner

## Automatic Deploy (push to main)
Push to `main` triggers GitHub Actions → Docker build → GHCR → Hetzner.

## Manual Deploy
```bash
cd /tmp/ForFor-clone
gh workflow run "Deploy to Hetzner" --ref main
```

## Troubleshooting Deploy Failures

### Docker build: npm ci fails
- "Missing @swc/helpers": `rm -rf node_modules package-lock.json && npm install`, commit lock file
- "Could not find Prisma Schema": Ensure Dockerfile copies `prisma/` before `npm ci`

### Docker build: Prisma errors
- "libssl not found": Ensure Dockerfile has `RUN apk add --no-cache openssl` in runner stage
- "binary target": Ensure `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` in schema.prisma

### Deploy step: prisma db push fails
- NEVER use `npx prisma` on server (downloads latest v7, incompatible)
- Use: `docker compose exec -T forfor node node_modules/prisma/build/index.js db push --accept-data-loss`

### App crashes after deploy
- Check logs: `ssh deploy@89.167.90.112 "docker logs forfor --tail 20"`
- Restart: `ssh deploy@89.167.90.112 "cd /home/deploy/hosting && docker compose restart forfor"`

### Seed database
```bash
ssh deploy@89.167.90.112 "docker exec proxy-manager curl -s http://forfor:3000/api/seed?secret=forfor2026"
```

## Git push rejected (email privacy)
Use noreply email for both author and committer:
```bash
GIT_COMMITTER_EMAIL="Tschiffer46@users.noreply.github.com" \
GIT_COMMITTER_NAME="Thomas Schiffer" \
git commit --author="Thomas Schiffer <Tschiffer46@users.noreply.github.com>" -m "message"
```
