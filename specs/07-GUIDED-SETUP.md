# Phase 3 — Guided Setup

## Overview

After the user deploys their docker-compose stack, the guided setup wizard walks them through initial configuration of each service. This is where most self-hosting newcomers abandon the process, so it's the highest-value piece.

**Implementation approach:** The wizard runs as a separate web page (or section of the app) that the user opens alongside their running services. It provides step-by-step instructions with screenshots, and where possible, uses service APIs to automate configuration.

**Phase 3 is the final milestone.** It ships after Phase 1 (assessment) and Phase 2 (configurator) are stable.

---

## Two Modes of Setup Guidance

### Mode 1: Interactive Guide (Always Available)

Step-by-step instructions with screenshots and copy-paste values. Works for any service regardless of whether we can reach it via API. This is the minimum viable version of Phase 3.

### Mode 2: API-Assisted Setup (Advanced)

The user provides their server's IP/hostname and the wizard directly configures services via their APIs. This requires the wizard to be able to reach the user's server — either by running on the same network, or via Tailscale, or by the user entering their server address.

**Important security consideration:** We never ask for or store API keys server-side. All API communication happens client-side (browser → user's server). The user's API keys stay in their browser.

---

## Setup Order

Services need to be configured in dependency order. This is the recommended sequence:

```
1. Verify all containers are running (Portainer or docker ps)
2. VPN verification (Gluetun — confirm IP is masked)
3. Download client (qBittorrent — basic settings, connection limits)
4. Indexer manager (Prowlarr — add indexers)
5. Media management (Sonarr — quality profiles, root folders, connect to Prowlarr & download client)
6. Media management (Radarr — same as Sonarr)
7. Media management (Lidarr — if selected)
8. Subtitle manager (Bazarr — connect to Sonarr/Radarr, add providers)
9. Media server (Jellyfin/Plex — library setup, hardware transcoding)
10. Request management (Overseerr/Jellyseerr — connect to media server + *arr apps)
11. Photos (Immich — create account, configure mobile apps)
12. Files (Nextcloud/Syncthing — create accounts, install clients)
13. Reverse proxy (Caddy/NPM — configure domains)
14. Authentication (Authelia — configure users, 2FA)
15. Remote access (Tailscale — install, connect devices)
16. Dashboard (Homepage — auto-configured if we generated the config)
17. Monitoring (Uptime Kuma — add service checks)
18. Media processing (Tdarr — configure libraries, transcode settings)
```

---

## Service-Specific Setup Guides

### Gluetun (VPN Verification)

**Step 1:** Check container logs
```bash
docker logs gluetun
```
Look for "Initialization sequence completed" or similar success message.

**Step 2:** Verify IP
```bash
docker exec gluetun wget -qO- https://ipinfo.io
```
Should show VPN provider's IP, not the user's real IP.

**Step 3:** Verify kill switch
Explain what the kill switch does and how to test it.

**API automation:** None needed. This is a verification step.

---

### qBittorrent

**Step 1:** Access WebUI at `http://server-ip:8080`
- Default credentials: admin / adminadmin (newer versions generate a random password in logs)
- Instruct to change password immediately

**Step 2:** Configure basic settings
- Downloads → Default save path: `/downloads/complete`
- Downloads → Incomplete downloads: `/downloads/incomplete`
- Connection → Max connections: 500 (reasonable default)
- Speed → Alternative rate limits for daytime: suggest setting limits if bandwidth-constrained
- BitTorrent → Seeding goals: ratio 1.0 or time-based

**Step 3:** Category setup for *arr integration
Create categories that Sonarr/Radarr will use:
- `sonarr` → save path: `/downloads/complete/tv`
- `radarr` → save path: `/downloads/complete/movies`
- `lidarr` → save path: `/downloads/complete/music` (if applicable)

**API automation possible:**
```
POST http://server:8080/api/v2/app/setPreferences
{
  "save_path": "/downloads/complete",
  "temp_path": "/downloads/incomplete",
  "max_connec": 500,
  "max_connec_per_torrent": 100
}
```

---

### Prowlarr

**Step 1:** Access at `http://server-ip:9696`
- Set up authentication on first launch

**Step 2:** Add indexers
- Guide user through adding their indexers
- Explain what indexers are for beginners: "Indexers are search engines for content. They help Sonarr and Radarr find what you're looking for."
- For beginners, recommend 2-3 well-known public indexers to start
- For intermediate/advanced, guide through adding private trackers/usenet indexers

**Step 3:** Configure app sync
- Settings → Apps → Add Sonarr
  - Prowlarr Server: `http://prowlarr:9696`
  - Sonarr Server: `http://sonarr:8989`
  - API Key: (get from Sonarr → Settings → General)
- Repeat for Radarr, Lidarr

**API automation possible:**
```
POST http://server:9696/api/v1/applications
{
  "name": "Sonarr",
  "implementation": "Sonarr",
  "fields": [
    {"name": "prowlarrUrl", "value": "http://prowlarr:9696"},
    {"name": "baseUrl", "value": "http://sonarr:8989"},
    {"name": "apiKey", "value": "SONARR_API_KEY"}
  ]
}
```

---

### Sonarr

**Step 1:** Access at `http://server-ip:8989`

**Step 2:** Configure root folder
- Settings → Media Management → Root Folders → Add → `/tv`

**Step 3:** Connect download client
- Settings → Download Clients → Add → qBittorrent
  - Host: `gluetun` (not localhost, because qBittorrent uses Gluetun's network)
  - Port: `8080`
  - Category: `sonarr`

**Step 4:** Quality profiles
For beginners, explain what quality profiles do and set up sensible defaults:
- "Any" profile for users who don't care about quality specifics
- "HD-1080p" for most users
- "Ultra-HD" for 4K users

Guide through selecting quality cutoffs.

**Step 5:** Add a test show
Walk the user through searching for and adding a show to verify everything works end-to-end.

**API automation possible:**
```
# Add root folder
POST http://server:8989/api/v3/rootfolder
{"path": "/tv"}

# Add download client
POST http://server:8989/api/v3/downloadclient
{
  "name": "qBittorrent",
  "implementation": "QBittorrent",
  "fields": [
    {"name": "host", "value": "gluetun"},
    {"name": "port", "value": 8080},
    {"name": "category", "value": "sonarr"}
  ]
}
```

---

### Radarr

Nearly identical to Sonarr setup but:
- Root folder: `/movies`
- Download client category: `radarr`
- Different quality profiles (movies tend to be larger, different preferences)

**Step 5:** Add a test movie instead of show.

---

### Bazarr

**Step 1:** Access at `http://server-ip:6767`

**Step 2:** Connect to Sonarr/Radarr
- Settings → Sonarr: enter server URL and API key
- Settings → Radarr: same

**Step 3:** Add subtitle providers
- Guide through adding OpenSubtitles (free account), Addic7ed, or other providers
- Configure languages

**Step 4:** Set up subtitle profiles
- Default: preferred language + fallback language

---

### Jellyfin / Plex

**Jellyfin:**

**Step 1:** Access at `http://server-ip:8096`
- Initial setup wizard handles user creation and language

**Step 2:** Add media libraries
- Movies → `/movies`
- TV Shows → `/tv`
- Music → `/music` (if applicable)

**Step 3:** Enable hardware transcoding (if applicable)
- Dashboard → Playback → Transcoding
- Enable Intel QSV / VAAPI (if GPU passthrough configured)
- Test with a sample transcode

**Plex:**

**Step 1:** Access at `http://server-ip:32400/web`
- Claim server using Plex account
- If using claim token from compose, this may be automatic

**Step 2:** Add libraries (same paths as Jellyfin)

**Step 3:** Enable hardware transcoding (requires Plex Pass)
- Settings → Transcoder → Use hardware acceleration when available

---

### Overseerr / Jellyseerr

**Step 1:** Access at `http://server-ip:5055`

**Step 2:** Connect to media server
- Sign in with Plex account (Overseerr) or enter Jellyfin URL + credentials (Jellyseerr)

**Step 3:** Connect to Sonarr/Radarr
- Add Sonarr: hostname `sonarr`, port `8989`, API key
- Add Radarr: hostname `radarr`, port `7878`, API key
- Map quality profiles

**Step 4:** Configure users
- Set up who can request (all household members)
- Set request limits if desired

---

### Immich

**Step 1:** Access at `http://server-ip:2283`
- Create admin account

**Step 2:** Configure storage
- Should already be set via environment variables in compose

**Step 3:** Set up mobile app
- Install Immich app on iOS/Android
- Enter server URL: `http://server-ip:2283`
- Log in with admin account
- Enable auto-upload in app settings
- Configure which albums/folders to upload

**Step 4:** Bulk upload existing library
- Guide through using the Immich CLI tool for initial library upload
```bash
npm install -g @immich/cli
immich upload --server http://server-ip:2283 --key API_KEY /path/to/photos
```

**Step 5:** Share with family
- Create accounts for other household members
- Set up shared albums

---

### Tailscale (Remote Access)

**Step 1:** Container should be running and connected
- Check with `docker logs tailscale`

**Step 2:** Authorize the machine
- Go to Tailscale admin console (login.tailscale.com)
- Approve the new machine

**Step 3:** Install Tailscale on client devices
- Guide through installing on phone, laptop, etc.
- All devices on the same Tailscale network can access the server

**Step 4:** Test access
- From a client device on Tailscale, access a service using the Tailscale IP
- e.g., `http://100.x.y.z:8096` for Jellyfin

**Step 5:** Optional: Enable subnet routing
- Allows accessing ALL devices on the home LAN through Tailscale
- Useful for reaching the server by its local IP from anywhere

---

### Tdarr

**Step 1:** Access at `http://server-ip:8265`

**Step 2:** Add libraries
- Source: `/movies` and `/tv`
- Transcode cache: `/temp`

**Step 3:** Configure transcode plugins
- For beginners, recommend a standard flow:
  - If H.264 → convert to H.265 (HEVC) to save ~30-50% space
  - Keep original resolution and audio
  - Use hardware encoding if available (QSV/NVENC)

**Step 4:** Set schedule
- Configure to run during off-peak hours
- Set CPU/GPU usage limits

**Step 5:** Monitor initial processing
- Large libraries can take days to process
- Show progress dashboard

---

## Setup Completion Checklist

After all services are configured, present a summary checklist:

```
✅ VPN connection verified
✅ Download client configured
✅ Indexers added to Prowlarr
✅ Sonarr connected and tested
✅ Radarr connected and tested
✅ Media server libraries created
✅ Request manager linked
✅ Photo backup configured + mobile apps set up
✅ Remote access working
✅ Dashboard configured

Your server is ready! Here's what to do next:
→ Add your favorite shows and movies to Sonarr/Radarr
→ Upload your photo library to Immich
→ Install the Jellyfin/Plex app on your streaming devices
→ Share Overseerr/Jellyseerr with your household
→ Set a calendar reminder to check on your server monthly
```

---

## Post-Setup Recommendations

### For beginners:
- Join r/selfhosted on Reddit
- Bookmark the Jellyfin/Plex/Immich docs
- Set up Uptime Kuma notifications so you know when something goes down
- Enable Watchtower for automatic updates

### For intermediate:
- Learn about docker logs and troubleshooting
- Set up proper backups of your config directory
- Consider Authelia for SSO
- Explore additional services from the catalog

### For advanced:
- Set up monitoring (Grafana + Prometheus)
- Implement 3-2-1 backup strategy
- Configure firewall rules
- Set up automated health checks and alerts
