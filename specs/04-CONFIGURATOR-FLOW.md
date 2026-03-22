# Phase 2 — Configurator Flow

## Overview

The configurator takes assessment answers (or can be used standalone) and guides the user through selecting services, resolving dependencies, and generating a complete docker-compose.yml + .env file + directory structure setup script.

---

## Entry Points

### From Assessment (Phase 1)

Assessment results pre-select services based on answers:

| Assessment Answer | Pre-selected Services |
|------------------|-----------------------|
| Wants media streaming | Jellyfin OR Plex (based on skill level) |
| Wants automated media | Sonarr + Radarr + Prowlarr + qBittorrent + Gluetun |
| Wants music | Lidarr + Navidrome (or Jellyfin music) |
| Wants photo backup | Immich |
| Wants file sync | Nextcloud OR Syncthing (based on feature needs) |
| Wants versioned backup | Kopia OR Duplicati |
| Remote access needed | Tailscale (default) OR reverse proxy |
| Wants ad blocking | AdGuard Home |
| Household > 2 people | Overseerr/Jellyseerr |
| Wants subtitles | Bazarr |
| Beginner | Portainer + Watchtower + Homepage |
| Transcoding needed | Tdarr |

The user arrives at the configurator with these pre-selected but can add/remove anything.

### Standalone Entry

User goes directly to configurator. All services available, nothing pre-selected. They browse the catalog and pick what they want.

---

## Configurator Screen Flow

```
Screen C1: Service Selection (category-based grid)
    ↓
Screen C2: Dependency Resolution & Conflicts
    ↓
Screen C3: Configuration Options (per-service settings)
    ↓
Screen C4: Path & Environment Setup
    ↓
Screen C5: Review & Generate
    ↓
Output: docker-compose.yml + .env + setup.sh
```

---

## Screen C1: Service Selection

### Layout

Grid or card-based layout, grouped by category. Each service shows:
- Name + icon
- One-line description
- Skill level badge (beginner/intermediate/advanced)
- Toggle to select/deselect
- "Why?" tooltip explaining when you'd want this

### Skill-Level Gating

Based on the user's self-reported skill level:

- **Beginner:** Show all services, but dim/collapse advanced ones. Pre-select the recommended stack. Show a "Recommended Setup" one-click preset.
- **Intermediate:** Show all services equally. Pre-select from assessment if available.
- **Advanced:** Show all services. No pre-selection unless from assessment.

### One-Click Presets

Quick-start configurations for common use cases:

**"Media Server Starter"** (Beginner)
Jellyfin + Sonarr + Radarr + Prowlarr + qBittorrent + Gluetun + Homepage

**"Full Media Stack"** (Intermediate)
Jellyfin + Sonarr + Radarr + Prowlarr + Bazarr + qBittorrent + Gluetun + Overseerr + Tdarr + Homepage + Watchtower

**"Photo & Files"** (Beginner)
Immich + Syncthing + Homepage

**"Everything"** (Advanced)
Full media stack + Immich + Nextcloud + Kopia + AdGuard Home + Authelia + Caddy + Uptime Kuma + Portainer + Vaultwarden + Paperless-ngx

---

## Screen C2: Dependency Resolution

After selection, the system checks dependencies and conflicts.

### Dependency Rules

```
Sonarr → requires: [Prowlarr, ONE_OF(qBittorrent, Transmission, SABnzbd, NZBGet)]
Radarr → requires: [Prowlarr, ONE_OF(qBittorrent, Transmission, SABnzbd, NZBGet)]
Lidarr → requires: [Prowlarr, ONE_OF(qBittorrent, Transmission, SABnzbd, NZBGet)]
Readarr → requires: [Prowlarr, ONE_OF(qBittorrent, Transmission, SABnzbd, NZBGet)]
Bazarr → requires: [ONE_OF(Sonarr, Radarr)]
Overseerr → requires: [Plex, ONE_OF(Sonarr, Radarr)]
Jellyseerr → requires: [Jellyfin, ONE_OF(Sonarr, Radarr)]
Tautulli → requires: [Plex]
qBittorrent → recommends: [Gluetun]
Transmission → recommends: [Gluetun]
Authelia → requires: [ONE_OF(Caddy, Traefik, NPM)]
Tdarr → recommends: [GPU_passthrough]
```

### Conflict Rules

```
Caddy ↔ Traefik ↔ NPM  (only one reverse proxy)
Pi-hole ↔ AdGuard Home  (only one DNS/ad blocker)
Overseerr ↔ Jellyseerr  (pick one based on media server)
```

### Resolution UI

When dependencies are unmet:
- Show a clear message: "Sonarr needs a download client. Which would you like?"
- Present the options with brief descriptions
- Auto-select the recommended option (qBittorrent for torrents) but let user change

When conflicts exist:
- Show a clear message: "You've selected both Caddy and Nginx Proxy Manager. These serve the same purpose — pick one."
- Brief comparison to help them decide

---

## Screen C3: Configuration Options

Per-service settings that need user input. Group by service.

### Global Settings (always shown)

| Setting | Description | Default |
|---------|-------------|---------|
| PUID | Linux user ID for file permissions | 1000 |
| PGID | Linux group ID for file permissions | 1000 |
| TZ | Timezone | Auto-detect from browser |
| BASE_DIR | Root directory for all data | /opt/docker |
| MEDIA_DIR | Media storage path | ${BASE_DIR}/media |
| CONFIG_DIR | Service configs path | ${BASE_DIR}/config |

### VPN Settings (when Gluetun selected)

See `06-VPN-CONFIG.md` for full details.

| Setting | Description |
|---------|-------------|
| VPN_PROVIDER | Selected provider (Mullvad, SurfShark, etc.) |
| Provider-specific credentials | Varies by provider |
| VPN_SERVER_REGION | Optional: preferred server location |

### Media Server Settings

| Setting | Description |
|---------|-------------|
| GPU_PASSTHROUGH | Enable Intel QuickSync / Nvidia GPU | Auto-detect or manual |
| PLEX_CLAIM | Plex claim token (if Plex selected) | Link to plex.tv/claim |

### Immich Settings

| Setting | Description |
|---------|-------------|
| IMMICH_DB_PASSWORD | Database password | Auto-generate |
| PHOTO_DIR | Photo storage location | ${BASE_DIR}/photos |
| ENABLE_ML | Enable machine learning features | true |

### Reverse Proxy Settings (when selected)

| Setting | Description |
|---------|-------------|
| DOMAIN | Custom domain name | Optional |
| EMAIL | Email for Let's Encrypt SSL | Required if domain set |

### Beginner Mode

For beginners, auto-fill sensible defaults and collapse advanced options. Show a single "Looks good, generate it!" button with the option to "Customize settings" for those who want control.

---

## Screen C4: Path & Environment Setup

Show the user the directory structure that will be created:

```
/opt/docker/
├── config/
│   ├── jellyfin/
│   ├── sonarr/
│   ├── radarr/
│   ├── prowlarr/
│   ├── qbittorrent/
│   ├── gluetun/
│   └── ...
├── media/
│   ├── movies/
│   ├── tv/
│   ├── music/
│   └── downloads/
│       ├── complete/
│       └── incomplete/
├── photos/
├── files/
└── backups/
```

Let them adjust the base path. The setup script creates this entire tree.

Explain: "Config data is separate from media data so you can put configs on your SSD and media on your HDDs."

---

## Screen C5: Review & Generate

### Summary View

Show everything that will be generated:

1. **Services selected** — list with ports and descriptions
2. **Networks** — which networks are created and who's on them
3. **Storage** — estimated total disk usage for configs + media
4. **Ports** — all exposed ports, check for conflicts
5. **Environment variables** — all values (passwords redacted)

### Port Conflict Detection

Check for port conflicts across selected services. If two services want the same port, flag it and offer to remap.

### Generated Files

**docker-compose.yml** — The complete compose file with all selected services, properly networked, with shared volumes and dependencies.

**`.env`** — All environment variables with user-provided values and auto-generated passwords.

**`setup.sh`** — A bash script that:
1. Creates the directory structure
2. Sets permissions (PUID/PGID)
3. Optionally installs Docker and Docker Compose if not present
4. Provides first-run instructions

**`Caddyfile`** (if Caddy selected) — Reverse proxy configuration for all selected services.

**`README.md`** — Setup instructions specific to their configuration. "Run these commands to get started."

### Download Options

- Download as .zip containing all files
- Copy docker-compose.yml to clipboard
- Copy individual files to clipboard

---

## Compose Generation Architecture

### Service Module Structure (in code)

```typescript
// Each service is a module:
// src/lib/services/jellyfin.ts

import type { ServiceModule } from '$lib/types';

export const jellyfin: ServiceModule = {
  id: 'jellyfin',
  name: 'Jellyfin',
  category: 'media-server',
  skill_level: 'beginner',
  requires: [],
  recommends: ['jellyseerr'],
  conflicts: [],
  networks: ['media'],
  
  // Returns compose fragment based on user config
  compose(config) {
    return {
      image: 'jellyfin/jellyfin:latest',
      container_name: 'jellyfin',
      environment: [
        `PUID=${config.puid}`,
        `PGID=${config.pgid}`,
        `TZ=${config.tz}`,
      ],
      volumes: [
        '${CONFIG_DIR}/jellyfin:/config',
        '${MEDIA_DIR}/movies:/movies',
        '${MEDIA_DIR}/tv:/tv',
        ...(config.music ? ['${MEDIA_DIR}/music:/music'] : []),
      ],
      ports: ['8096:8096'],
      ...(config.gpu ? { devices: ['/dev/dri:/dev/dri'] } : {}),
      restart: 'unless-stopped',
      networks: ['media'],
    };
  },
};
```

### Assembly Process

```
1. Collect selected services
2. Resolve dependencies (add required services)
3. Check for conflicts (prompt user to resolve)
4. For each service, call compose(userConfig) to get fragment
5. Merge all fragments into a single compose object
6. Deduplicate and create networks
7. Generate .env file from all environment variables
8. Serialize to YAML
```

### Special Handling: VPN-Routed Services

When a service routes through Gluetun:
1. Remove `ports` from the service
2. Add those ports to Gluetun's port list
3. Set `network_mode: "service:gluetun"` on the service
4. Remove the service from named networks (it shares Gluetun's network stack)

```typescript
// In the assembly step:
if (service.vpn_routed && selectedServices.includes('gluetun')) {
  gluetunPorts.push(...service.ports);
  service.ports = [];
  service.network_mode = 'service:gluetun';
  service.networks = []; // uses gluetun's network stack
}
```

### Special Handling: Multi-Container Services

Services like Immich and Nextcloud that need their own databases:
- Generate all related containers together
- Use service-specific environment variables for DB credentials
- Place on a shared private network
- Only expose the main service's port

---

## Validation Rules

Before generating, validate:

1. **No orphan dependencies** — every required service is selected
2. **No port conflicts** — no two services claim the same host port
3. **VPN provider configured** — if Gluetun selected, provider credentials are set
4. **Paths are absolute** — all volume paths resolve to absolute paths
5. **Passwords are set** — no empty password fields
6. **RAID alignment** — if storage calculations suggest RAID but user hasn't configured it, warn
