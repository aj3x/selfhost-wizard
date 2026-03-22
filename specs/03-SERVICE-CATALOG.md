# Service Catalog

## Overview

Each service is a composable module. When selected, it contributes a docker-compose fragment, declares its dependencies and conflicts, and specifies its network memberships and volume mounts.

The configurator assembles these fragments into a final docker-compose.yml.

---

## Service Registry Schema

Every service module has this shape:

```typescript
interface ServiceModule {
  id: string;                     // unique identifier
  name: string;                   // display name
  description: string;            // what it does, in plain language
  category: ServiceCategory;      // grouping for UI
  skill_level: "beginner" | "intermediate" | "advanced";  // minimum recommended skill
  requires: string[];             // service IDs that must also be selected
  recommends: string[];           // service IDs that are suggested alongside
  conflicts: string[];            // service IDs that shouldn't be used with this
  networks: string[];             // docker networks this service joins
  volumes: VolumeMount[];         // persistent storage
  ports: PortMapping[];           // exposed ports (host:container)
  environment: EnvVar[];          // environment variables (some user-provided)
  compose: ComposeFragment;       // the docker-compose YAML fragment
  setup_api?: SetupConfig;        // Phase 3: API-based initial configuration
  resource_estimate: {            // for hardware sizing
    ram_mb: number;
    cpu_shares: number;
    storage_gb: number;           // app data, not media
  };
}
```

---

## Categories

| Category | Services |
|----------|----------|
| Media Server | Plex, Jellyfin |
| Media Management | Sonarr, Radarr, Lidarr, Readarr, Bazarr, Prowlarr, Overseerr/Jellyseerr, Tautulli |
| Download Clients | qBittorrent, Transmission, SABnzbd, NZBGet |
| Media Processing | Tdarr |
| Photos | Immich |
| Files & Sync | Nextcloud, Syncthing, Filebrowser |
| Backup | Duplicati, Kopia |
| Networking | Gluetun (VPN), Tailscale, Traefik, Nginx Proxy Manager, Caddy |
| DNS & Ad Blocking | Pi-hole, AdGuard Home |
| Authentication | Authelia, Authentik |
| Home Automation | Home Assistant |
| Productivity | Vaultwarden, Paperless-ngx, Mealie, Bookstack |
| Monitoring | Uptime Kuma, Portainer, Watchtower, Homepage |

---

## Service Details

### Media Server

#### Plex

```yaml
services:
  plex:
    image: lscr.io/linuxserver/plex:latest
    container_name: plex
    network_mode: host  # or bridge with port mappings
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - VERSION=docker
      # - PLEX_CLAIM=${PLEX_CLAIM}  # optional, for initial setup
    volumes:
      - ${CONFIG_DIR}/plex:/config
      - ${MEDIA_DIR}/movies:/movies
      - ${MEDIA_DIR}/tv:/tv
      - ${MEDIA_DIR}/music:/music  # if music selected
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Requires:** None
- **Recommends:** Overseerr (request management), Tautulli (analytics)
- **Conflicts:** None (can coexist with Jellyfin, but unusual)
- **RAM:** ~512 MB idle, 1-4 GB under load (transcoding)
- **CPU:** Low for direct play, high for transcoding
- **Notes:** Plex Pass ($5/month or $120 lifetime) unlocks hardware transcoding and some features. We should note this cost. Has the most polished client apps. Closed source. Requires internet connection for auth by default.

#### Jellyfin

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    # If GPU transcoding needed (Intel QuickSync):
    # devices:
    #   - /dev/dri:/dev/dri
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/jellyfin:/config
      - ${MEDIA_DIR}/movies:/movies
      - ${MEDIA_DIR}/tv:/tv
      - ${MEDIA_DIR}/music:/music
    ports:
      - "8096:8096"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Beginner (slightly more setup than Plex)
- **Requires:** None
- **Recommends:** Jellyseerr (request management)
- **Conflicts:** None
- **RAM:** ~256 MB idle, 1-2 GB under load
- **Notes:** Completely free and open source. No account required. Hardware transcoding works with Intel QuickSync (most mini PCs) and Nvidia GPUs. Client apps less polished than Plex but improving rapidly.

**Recommendation logic:**
- Beginner → Plex (better out-of-box experience, polished apps)
- Intermediate → Present both, lean Jellyfin (free, no phoning home)
- Advanced → Jellyfin default (open source, full control)
- Non-tech-savvy household members → Plex (familiar UI for them)

---

### Media Management — The *arr Stack

#### Prowlarr (Indexer Manager)

```yaml
services:
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/prowlarr:/config
    ports:
      - "9696:9696"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Intermediate
- **Requires:** At least one of [Sonarr, Radarr, Lidarr, Readarr]
- **Recommends:** All *arr apps
- **Notes:** Centralized indexer management. Add indexers once, sync to all *arr apps. This is the first thing to set up in the *arr stack.

#### Sonarr (TV Shows)

```yaml
services:
  sonarr:
    image: lscr.io/linuxserver/sonarr:latest
    container_name: sonarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/sonarr:/config
      - ${MEDIA_DIR}:/media  # see note on unified media path
    ports:
      - "8989:8989"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Intermediate
- **Requires:** Prowlarr, at least one download client
- **Recommends:** Bazarr (subtitles)
- **RAM:** ~256 MB
- **Notes:** Manages TV show monitoring, downloading, and organization. Needs a download client and indexers (via Prowlarr).

#### Radarr (Movies)

```yaml
services:
  radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/radarr:/config
      - ${MEDIA_DIR}:/media
    ports:
      - "7878:7878"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Intermediate
- **Requires:** Prowlarr, at least one download client
- **Recommends:** Bazarr (subtitles)
- **RAM:** ~256 MB

#### Lidarr (Music)

```yaml
services:
  lidarr:
    image: lscr.io/linuxserver/lidarr:latest
    container_name: lidarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/lidarr:/config
      - ${MEDIA_DIR}:/media
    ports:
      - "8686:8686"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Intermediate
- **Requires:** Prowlarr, at least one download client
- **Shown when:** User selected music self-hosting

#### Readarr (Books/Audiobooks)

```yaml
services:
  readarr:
    image: lscr.io/linuxserver/readarr:develop
    container_name: readarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/readarr:/config
      - ${MEDIA_DIR}:/media
    ports:
      - "8787:8787"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Intermediate
- **Requires:** Prowlarr, at least one download client
- **Notes:** Less mature than Sonarr/Radarr. Still in development branch.

#### Bazarr (Subtitles)

```yaml
services:
  bazarr:
    image: lscr.io/linuxserver/bazarr:latest
    container_name: bazarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/bazarr:/config
      - ${MEDIA_DIR}/movies:/movies
      - ${MEDIA_DIR}/tv:/tv
    ports:
      - "6767:6767"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Beginner
- **Requires:** Sonarr and/or Radarr
- **Notes:** Automatically downloads subtitles for your media.

#### Overseerr / Jellyseerr (Request Management)

```yaml
services:
  overseerr:  # or jellyseerr
    image: lscr.io/linuxserver/overseerr:latest  # or fallenbagel/jellyseerr
    container_name: overseerr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/overseerr:/config
    ports:
      - "5055:5055"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Beginner
- **Requires:** Plex (Overseerr) or Jellyfin (Jellyseerr), plus Sonarr and/or Radarr
- **Notes:** Lets household members request movies/shows through a clean UI. Automatically sends requests to Sonarr/Radarr.

#### Tautulli (Plex Analytics)

```yaml
services:
  tautulli:
    image: lscr.io/linuxserver/tautulli:latest
    container_name: tautulli
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/tautulli:/config
    ports:
      - "8181:8181"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Beginner
- **Requires:** Plex
- **Notes:** Monitoring and analytics for Plex usage. Shows who's watching what, stream quality, history.

---

### Download Clients

#### qBittorrent

```yaml
services:
  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    container_name: qbittorrent
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - WEBUI_PORT=8080
    volumes:
      - ${CONFIG_DIR}/qbittorrent:/config
      - ${MEDIA_DIR}/downloads:/downloads
    # Ports handled by Gluetun when VPN is enabled (see VPN section)
    # ports:
    #   - "8080:8080"
    #   - "6881:6881"
    restart: unless-stopped
    network_mode: "service:gluetun"  # Route through VPN
```

- **Skill level:** Beginner
- **Requires:** Gluetun (when VPN routing is enabled)
- **Notes:** Default torrent client recommendation. When routed through Gluetun, ports are exposed on the Gluetun container instead. Web UI available.

#### SABnzbd (Usenet)

```yaml
services:
  sabnzbd:
    image: lscr.io/linuxserver/sabnzbd:latest
    container_name: sabnzbd
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/sabnzbd:/config
      - ${MEDIA_DIR}/downloads:/downloads
    ports:
      - "8080:8080"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Intermediate
- **Requires:** Usenet provider subscription (not included in our cost model — user adds manually)
- **Notes:** Usenet downloader. Does NOT need VPN routing — usenet traffic is SSL encrypted to the provider. This is important: do not route usenet clients through Gluetun unnecessarily.

#### NZBGet (Usenet — Alternative)

Similar to SABnzbd. Lighter weight but less actively developed. Include as option for advanced users.

---

### Media Processing

#### Tdarr (Transcoding/Optimization)

```yaml
services:
  tdarr:
    image: ghcr.io/haveagitgat/tdarr:latest
    container_name: tdarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - serverIP=0.0.0.0
      - serverPort=8266
      - webUIPort=8265
      - internalNode=true
      - inContainer=true
      # GPU transcoding (Intel QuickSync):
      # - NVIDIA_VISIBLE_DEVICES=all  # for Nvidia
    # devices:
    #   - /dev/dri:/dev/dri  # Intel QuickSync
    volumes:
      - ${CONFIG_DIR}/tdarr/server:/app/server
      - ${CONFIG_DIR}/tdarr/configs:/app/configs
      - ${CONFIG_DIR}/tdarr/logs:/app/logs
      - ${MEDIA_DIR}/movies:/movies
      - ${MEDIA_DIR}/tv:/tv
      - /tmp/tdarr:/temp  # transcode temp space — use SSD!
    ports:
      - "8265:8265"
      - "8266:8266"
    restart: unless-stopped
    networks:
      - media
```

- **Skill level:** Intermediate
- **Recommends:** GPU passthrough for performance
- **Shown when:** User needs transcoding (mixed devices, 4K library, wants to save space)
- **Notes:** Pre-transcodes your library into compatible formats. Reduces real-time transcoding load. Can also convert to H.265 to save significant storage space (30-50% reduction). Needs fast temp storage (SSD).

---

### Photos

#### Immich

```yaml
services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:release
    container_name: immich-server
    environment:
      - DB_HOSTNAME=immich-postgres
      - DB_USERNAME=${IMMICH_DB_USER:-postgres}
      - DB_PASSWORD=${IMMICH_DB_PASSWORD}
      - DB_DATABASE_NAME=${IMMICH_DB_NAME:-immich}
      - REDIS_HOSTNAME=immich-redis
      - UPLOAD_LOCATION=/usr/src/app/upload
      - IMMICH_MACHINE_LEARNING_URL=http://immich-machine-learning:3003
    volumes:
      - ${PHOTO_DIR}:/usr/src/app/upload
    ports:
      - "2283:2283"
    depends_on:
      - immich-redis
      - immich-postgres
    restart: unless-stopped
    networks:
      - immich

  immich-machine-learning:
    image: ghcr.io/immich-app/immich-machine-learning:release
    container_name: immich-machine-learning
    volumes:
      - ${CONFIG_DIR}/immich/ml-cache:/cache
    restart: unless-stopped
    networks:
      - immich

  immich-redis:
    image: redis:6.2-alpine
    container_name: immich-redis
    restart: unless-stopped
    networks:
      - immich

  immich-postgres:
    image: tensorchord/pgvecto-rs:pg14-v0.2.0
    container_name: immich-postgres
    environment:
      - POSTGRES_PASSWORD=${IMMICH_DB_PASSWORD}
      - POSTGRES_USER=${IMMICH_DB_USER:-postgres}
      - POSTGRES_DB=${IMMICH_DB_NAME:-immich}
    volumes:
      - ${CONFIG_DIR}/immich/postgres:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - immich
```

- **Skill level:** Beginner (despite complexity — it's well-documented)
- **Requires:** None (self-contained with its own DB and Redis)
- **RAM:** ~1 GB minimum, 2-4 GB with ML features
- **CPU:** ML features benefit from GPU (but work without)
- **Notes:** The leading self-hosted Google Photos replacement. Face recognition, smart search, timeline, map view, sharing. Mobile apps for iOS and Android with auto-upload. Multi-service compose — we generate all components together.

---

### Files & Sync

#### Nextcloud

```yaml
services:
  nextcloud:
    image: nextcloud:latest
    container_name: nextcloud
    environment:
      - POSTGRES_HOST=nextcloud-db
      - POSTGRES_DB=${NC_DB_NAME:-nextcloud}
      - POSTGRES_USER=${NC_DB_USER:-nextcloud}
      - POSTGRES_PASSWORD=${NC_DB_PASSWORD}
    volumes:
      - ${CONFIG_DIR}/nextcloud:/var/www/html
      - ${FILES_DIR}:/var/www/html/data
    ports:
      - "8443:443"
    depends_on:
      - nextcloud-db
    restart: unless-stopped
    networks:
      - nextcloud

  nextcloud-db:
    image: postgres:15-alpine
    container_name: nextcloud-db
    environment:
      - POSTGRES_DB=${NC_DB_NAME:-nextcloud}
      - POSTGRES_USER=${NC_DB_USER:-nextcloud}
      - POSTGRES_PASSWORD=${NC_DB_PASSWORD}
    volumes:
      - ${CONFIG_DIR}/nextcloud-db:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - nextcloud
```

- **Skill level:** Intermediate
- **RAM:** ~512 MB minimum
- **Notes:** Full Dropbox/Google Drive replacement. File sync, calendar, contacts, office docs, and many plugins. Heavier and more complex than Syncthing but offers more features. Best for users who want a web UI and multi-user file management.

#### Syncthing

```yaml
services:
  syncthing:
    image: lscr.io/linuxserver/syncthing:latest
    container_name: syncthing
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/syncthing:/config
      - ${FILES_DIR}/sync:/sync
    ports:
      - "8384:8384"
      - "22000:22000/tcp"
      - "22000:22000/udp"
      - "21027:21027/udp"
    restart: unless-stopped
    networks:
      - files
```

- **Skill level:** Beginner
- **Notes:** Peer-to-peer file sync. No central server required (but works great with one). Lighter than Nextcloud. Better for pure file sync without the extra features.

---

### Networking

#### Gluetun (VPN Container)

See `06-VPN-CONFIG.md` for detailed provider configuration.

```yaml
services:
  gluetun:
    image: qmcgaw/gluetun:latest
    container_name: gluetun
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    environment:
      - VPN_SERVICE_PROVIDER=${VPN_PROVIDER}
      # Provider-specific env vars added dynamically
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/gluetun:/gluetun
    ports:
      # Ports for services routed through VPN:
      - "8080:8080"   # qBittorrent WebUI
      - "6881:6881"   # qBittorrent
    restart: unless-stopped
    networks:
      - vpn
```

- **Skill level:** Intermediate
- **Notes:** Routes container traffic through VPN. Download clients use `network_mode: "service:gluetun"` and their ports are exposed on this container instead. Critical: only torrent clients need VPN routing. Usenet clients, *arr apps, media servers, and everything else should NOT go through the VPN.

#### Tailscale

```yaml
services:
  tailscale:
    image: tailscale/tailscale:latest
    container_name: tailscale
    hostname: ${HOSTNAME:-homeserver}
    environment:
      - TS_AUTHKEY=${TAILSCALE_AUTHKEY}
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_EXTRA_ARGS=--advertise-exit-node
    volumes:
      - ${CONFIG_DIR}/tailscale:/var/lib/tailscale
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    restart: unless-stopped
    network_mode: host
```

- **Skill level:** Beginner
- **Notes:** Easiest remote access solution. No port forwarding needed. All traffic encrypted. Free for up to 100 devices / 3 users. Recommend as default for any remote access need. Can also act as subnet router to expose entire server LAN.

#### Caddy (Reverse Proxy)

```yaml
services:
  caddy:
    image: caddy:latest
    container_name: caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ${CONFIG_DIR}/caddy/Caddyfile:/etc/caddy/Caddyfile
      - ${CONFIG_DIR}/caddy/data:/data
      - ${CONFIG_DIR}/caddy/config:/config
    restart: unless-stopped
    networks:
      - proxy
```

- **Skill level:** Intermediate
- **Notes:** Simplest reverse proxy. Automatic HTTPS via Let's Encrypt. Config file is human-readable. Recommended for intermediate users who want custom domain access.

#### Nginx Proxy Manager

```yaml
services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    ports:
      - "80:80"
      - "443:443"
      - "81:81"  # Admin UI
    volumes:
      - ${CONFIG_DIR}/npm/data:/data
      - ${CONFIG_DIR}/npm/letsencrypt:/etc/letsencrypt
    restart: unless-stopped
    networks:
      - proxy
```

- **Skill level:** Beginner (GUI-based)
- **Conflicts:** Caddy, Traefik (only use one reverse proxy)
- **Notes:** Web UI for managing reverse proxy. Easier for beginners than Caddy's config file. Automatic SSL.

#### Traefik

- **Skill level:** Advanced
- **Notes:** Most powerful, but complex configuration. Label-based auto-discovery of Docker services. Best for advanced users with many services. Compose fragment would use labels on each service rather than a central config file.

**Reverse proxy recommendation logic:**
- Beginner → Nginx Proxy Manager (GUI)
- Intermediate → Caddy (simple config)
- Advanced → Traefik (auto-discovery, most flexible)

---

### DNS & Ad Blocking

#### AdGuard Home

```yaml
services:
  adguard:
    image: adguard/adguardhome:latest
    container_name: adguard
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "3000:3000"  # Initial setup
      - "8053:80"    # Admin panel (after setup)
    volumes:
      - ${CONFIG_DIR}/adguard/work:/opt/adguardhome/work
      - ${CONFIG_DIR}/adguard/conf:/opt/adguardhome/conf
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Notes:** Network-wide ad blocking. Slightly easier to set up than Pi-hole. Built-in DHCP server. Encrypted DNS support out of the box. Recommend over Pi-hole for new setups.

---

### Authentication

#### Authelia

```yaml
services:
  authelia:
    image: authelia/authelia:latest
    container_name: authelia
    environment:
      - TZ=${TZ}
    volumes:
      - ${CONFIG_DIR}/authelia:/config
    ports:
      - "9091:9091"
    restart: unless-stopped
    networks:
      - proxy
```

- **Skill level:** Intermediate
- **Requires:** A reverse proxy (Caddy, Traefik, or NPM)
- **Notes:** Single sign-on and 2FA for all your services. One login for everything. Integrates with reverse proxy via forward auth. Config file based — we can generate it.

---

### Monitoring & Management

#### Homepage (Dashboard)

```yaml
services:
  homepage:
    image: ghcr.io/gethomepage/homepage:latest
    container_name: homepage
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
    volumes:
      - ${CONFIG_DIR}/homepage:/app/config
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "3000:3000"
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Notes:** Beautiful dashboard showing all your services with status, stats, and quick links. Great landing page. Config-file based — we can generate it with all selected services pre-configured.

#### Portainer

```yaml
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ${CONFIG_DIR}/portainer:/data
    ports:
      - "9000:9000"
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Notes:** GUI for managing Docker containers. Useful for beginners to see what's running, restart services, view logs.

#### Uptime Kuma

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    volumes:
      - ${CONFIG_DIR}/uptime-kuma:/app/data
    ports:
      - "3001:3001"
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Notes:** Monitors if your services are up. Sends notifications (Discord, email, Telegram, etc.) when something goes down.

#### Watchtower

```yaml
services:
  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    environment:
      - TZ=${TZ}
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_SCHEDULE=0 0 4 * * *  # 4 AM daily
      # - WATCHTOWER_NOTIFICATIONS=shoutrrr  # optional notifications
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Notes:** Automatically updates Docker containers. Set-and-forget. Some advanced users prefer manual updates for control — present as opt-in.

---

### Productivity

#### Vaultwarden

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    environment:
      - TZ=${TZ}
      # - SIGNUPS_ALLOWED=false  # disable after initial setup
    volumes:
      - ${CONFIG_DIR}/vaultwarden:/data
    ports:
      - "8222:80"
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Notes:** Self-hosted Bitwarden-compatible password manager. Uses official Bitwarden clients. Lightweight. Strongly recommended for anyone currently using a paid password manager — or no password manager at all.

#### Paperless-ngx

```yaml
services:
  paperless:
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    container_name: paperless
    environment:
      - PAPERLESS_REDIS=redis://paperless-redis:6379
      - PAPERLESS_DBHOST=paperless-db
      - PAPERLESS_OCR_LANGUAGE=eng
      - USERMAP_UID=${PUID}
      - USERMAP_GID=${PGID}
    volumes:
      - ${CONFIG_DIR}/paperless/data:/usr/src/paperless/data
      - ${CONFIG_DIR}/paperless/media:/usr/src/paperless/media
      - ${FILES_DIR}/paperless/consume:/usr/src/paperless/consume
    ports:
      - "8000:8000"
    depends_on:
      - paperless-db
      - paperless-redis
    restart: unless-stopped

  paperless-db:
    image: postgres:15
    container_name: paperless-db
    environment:
      - POSTGRES_DB=paperless
      - POSTGRES_USER=paperless
      - POSTGRES_PASSWORD=${PAPERLESS_DB_PASSWORD}
    volumes:
      - ${CONFIG_DIR}/paperless/pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  paperless-redis:
    image: redis:7
    container_name: paperless-redis
    restart: unless-stopped
```

- **Skill level:** Intermediate
- **Notes:** Document management with OCR. Scan and organize receipts, bills, letters. Searchable archive. Multi-service compose.

#### Mealie (Recipes)

```yaml
services:
  mealie:
    image: ghcr.io/mealie-recipes/mealie:latest
    container_name: mealie
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - BASE_URL=http://localhost:9925
    volumes:
      - ${CONFIG_DIR}/mealie:/app/data
    ports:
      - "9925:9000"
    restart: unless-stopped
```

- **Skill level:** Beginner
- **Notes:** Self-hosted recipe manager. Import recipes from URLs. Meal planning. Shopping lists.

---

## Docker Network Architecture

```
┌─────────────────────────────────────────────────┐
│                   proxy network                  │
│  (Caddy/Traefik/NPM + all services with WebUI) │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                   media network                  │
│  (Sonarr, Radarr, Prowlarr, Bazarr, Jellyfin,  │
│   Plex, Overseerr, Tautulli, Lidarr, Tdarr)    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                    vpn network                   │
│  (Gluetun → qBittorrent/Transmission)           │
│  NOTE: *arr apps connect to download client     │
│  via Gluetun's container network, not this net  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  immich network                  │
│  (immich-server, immich-ml, redis, postgres)    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  files network                   │
│  (Nextcloud/Syncthing, Duplicati, Filebrowser)  │
└─────────────────────────────────────────────────┘
```

Services that need to talk to each other share a network. Services behind a reverse proxy also join the `proxy` network.

---

## Volume / Path Convention

The generated compose uses a consistent, opinionated path structure:

```
${BASE_DIR}/                      # e.g., /srv or /opt/docker or ~/docker
├── config/                       # ${CONFIG_DIR} — all service configs
│   ├── plex/
│   ├── sonarr/
│   ├── radarr/
│   └── ...
├── media/                        # ${MEDIA_DIR} — shared media
│   ├── movies/
│   ├── tv/
│   ├── music/
│   └── downloads/
│       ├── complete/
│       └── incomplete/
├── photos/                       # ${PHOTO_DIR} — Immich uploads
├── files/                        # ${FILES_DIR} — Nextcloud/Syncthing data
│   ├── sync/
│   └── paperless/
└── backups/                      # ${BACKUP_DIR} — backup destinations
```

**Critical note on media paths:** The *arr apps and download clients MUST share a common parent directory for hardlinks/atomic moves to work. If Sonarr and qBittorrent both mount `/media`, a completed download can be hardlinked (instant, no disk space duplication) instead of copied. This is why we use a unified `/media` mount rather than separate `/downloads` and `/tv` mounts.

The configurator generates a `.env` file that defines these base paths, and the user only needs to edit the base paths to match their system.
