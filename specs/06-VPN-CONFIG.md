# VPN Configuration (Gluetun)

## Overview

Gluetun is the VPN container that routes download client traffic through a VPN tunnel. Only torrent download clients (qBittorrent, Transmission) should route through the VPN. Usenet clients (SABnzbd, NZBGet), *arr apps, media servers, and all other services should NOT go through the VPN.

---

## Routing Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Host Network                       │
│                                                      │
│  ┌─────────────┐    ┌──────────────────────────────┐ │
│  │  Sonarr     │    │         Gluetun              │ │
│  │  Radarr     │────│  ┌──────────────────────┐    │ │
│  │  Prowlarr   │    │  │    qBittorrent       │    │ │
│  │  Bazarr     │    │  │ (network_mode:       │    │ │
│  │  Jellyfin   │    │  │  service:gluetun)    │    │ │
│  │  Immich     │    │  └──────────────────────┘    │ │
│  │  etc.       │    │  VPN Tunnel ──→ Internet     │ │
│  └─────────────┘    └──────────────────────────────┘ │
│        │                        │                    │
│        └── Direct Internet ─────┘                    │
│            (no VPN)             (VPN only)            │
└──────────────────────────────────────────────────────┘
```

**Key principle:** The *arr apps communicate with qBittorrent via the Gluetun container's internal network. Sonarr sends download requests to `gluetun:8080` (qBittorrent's WebUI port, exposed on Gluetun). This works because qBittorrent shares Gluetun's network stack.

**Usenet note:** SABnzbd/NZBGet connect to usenet providers over SSL. The connection is already encrypted and authenticated. Running usenet traffic through a VPN adds latency and reduces download speed with zero security benefit. Usenet clients should connect directly to the internet.

---

## Supported Providers

### 1. Mullvad (Recommended)

**Why recommended:** No email required. No logging. Accept anonymous payment (cash, crypto). Simple account number system. Consistent quality. Fixed price.

**Gluetun config:**

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
      - VPN_SERVICE_PROVIDER=mullvad
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=${MULLVAD_PRIVATE_KEY}
      - WIREGUARD_ADDRESSES=${MULLVAD_ADDRESS}
      - SERVER_COUNTRIES=${VPN_COUNTRY:-}  # optional
    volumes:
      - ${CONFIG_DIR}/gluetun:/gluetun
    ports:
      - "8080:8080"   # qBittorrent WebUI
      - "6881:6881"   # qBittorrent peer port
      - "6881:6881/udp"
    restart: unless-stopped
```

**Setup instructions for user:**
1. Go to mullvad.net → Account → WireGuard configuration
2. Generate a key pair
3. Copy the private key → `MULLVAD_PRIVATE_KEY`
4. Copy the address (e.g., `10.66.x.x/32`) → `MULLVAD_ADDRESS`

**Cost:** 5 EUR/month (~$5.46 USD). No discounts for longer terms.

---

### 2. Surfshark

**Gluetun config:**

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=surfshark
      - VPN_TYPE=openvpn  # or wireguard
      - OPENVPN_USER=${SURFSHARK_USER}
      - OPENVPN_PASSWORD=${SURFSHARK_PASSWORD}
      - SERVER_COUNTRIES=${VPN_COUNTRY:-}
```

**For WireGuard (preferred for performance):**

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=surfshark
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=${SURFSHARK_WIREGUARD_KEY}
      - WIREGUARD_ADDRESSES=${SURFSHARK_WIREGUARD_ADDRESS}
      - SERVER_HOSTNAMES=${SURFSHARK_SERVER:-}  # e.g., us-nyc.prod.surfshark.com
```

**Setup instructions:**
1. Log in to Surfshark dashboard
2. For OpenVPN: Go to Manual Setup → OpenVPN → copy service credentials (NOT your account login)
3. For WireGuard: Go to Manual Setup → WireGuard → generate key pair → copy private key and address

**Cost:** Varies by plan. Typically $2.49-$4.99/month (longer commitments = cheaper).

---

### 3. ProtonVPN

**Gluetun config:**

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=protonvpn
      - VPN_TYPE=openvpn
      - OPENVPN_USER=${PROTON_OPENVPN_USER}
      - OPENVPN_PASSWORD=${PROTON_OPENVPN_PASSWORD}
      - SERVER_COUNTRIES=${VPN_COUNTRY:-}
```

**For WireGuard:**

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=protonvpn
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=${PROTON_WIREGUARD_KEY}
      - WIREGUARD_ADDRESSES=${PROTON_WIREGUARD_ADDRESS}
      - SERVER_HOSTNAMES=${PROTON_SERVER:-}
```

**Setup instructions:**
1. Log in to Proton account → ProtonVPN → OpenVPN/IKEv2 credentials
2. Copy the OpenVPN username and password (these are different from your Proton account credentials)
3. For WireGuard: Use the ProtonVPN Linux CLI or manual config generator

**Cost:** ~$4.99-$9.99/month depending on plan. VPN Plus tier or higher required for P2P servers.

**Note:** ProtonVPN's free tier does NOT support P2P/torrenting. Users need a paid plan. Must use P2P-compatible servers.

---

### 4. NordVPN

**Gluetun config:**

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=nordvpn
      - VPN_TYPE=openvpn  # NordVPN doesn't natively support WireGuard in Gluetun, uses NordLynx
      - OPENVPN_USER=${NORD_SERVICE_USER}
      - OPENVPN_PASSWORD=${NORD_SERVICE_PASSWORD}
      - SERVER_COUNTRIES=${VPN_COUNTRY:-}
```

**For WireGuard (NordLynx):**

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=nordvpn
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=${NORD_WIREGUARD_KEY}
      - SERVER_HOSTNAMES=${NORD_SERVER:-}
```

**Setup instructions:**
1. Log in to NordVPN dashboard → Manual Setup
2. For OpenVPN: Generate or view service credentials (username/password)
3. For WireGuard: Generate a WireGuard private key via NordVPN's access token method. See Gluetun wiki for current steps as this process changes periodically.

**Cost:** ~$3.69-$4.59/month depending on plan length.

**Note:** NordVPN's WireGuard setup with Gluetun can be finicky. OpenVPN is more reliable but slower. Recommend OpenVPN for simplicity unless user specifically wants WireGuard performance.

---

### 5. IPVanish

**Gluetun config:**

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=ipvanish
      - VPN_TYPE=openvpn
      - OPENVPN_USER=${IPVANISH_USER}
      - OPENVPN_PASSWORD=${IPVANISH_PASSWORD}
      - SERVER_COUNTRIES=${VPN_COUNTRY:-}
```

**Setup instructions:**
1. Use your IPVanish account username and password directly (IPVanish uses account credentials for OpenVPN)

**Cost:** ~$3.33-$11.99/month depending on plan.

---

### 6. Custom / Other Provider

For providers not in our top 5:

```yaml
    environment:
      - VPN_SERVICE_PROVIDER=custom
      - VPN_TYPE=openvpn  # or wireguard
      # For OpenVPN:
      - OPENVPN_CUSTOM_CONFIG=/gluetun/custom.ovpn
      - OPENVPN_USER=${CUSTOM_VPN_USER}
      - OPENVPN_PASSWORD=${CUSTOM_VPN_PASSWORD}
      # For WireGuard:
      - VPN_ENDPOINT_IP=${CUSTOM_WG_ENDPOINT}
      - VPN_ENDPOINT_PORT=${CUSTOM_WG_PORT:-51820}
      - WIREGUARD_PUBLIC_KEY=${CUSTOM_WG_PUBLIC_KEY}
      - WIREGUARD_PRIVATE_KEY=${CUSTOM_WG_PRIVATE_KEY}
      - WIREGUARD_ADDRESSES=${CUSTOM_WG_ADDRESS}
```

**Instructions:**
1. Download your provider's OpenVPN config (.ovpn) file or obtain WireGuard credentials
2. For OpenVPN: Place the .ovpn file in your Gluetun config directory
3. For WireGuard: Enter the connection details from your provider
4. Refer to the Gluetun wiki for provider-specific guidance: https://github.com/qdm12/gluetun-wiki

---

## VPN Provider Selection UI

In the configurator, present providers in this order:

1. **Mullvad** — "Recommended. No email, no logging, anonymous payment. $5.46/month."
2. **Surfshark** — "Budget-friendly with good performance. From $2.49/month."
3. **ProtonVPN** — "Privacy-focused Swiss provider. Requires paid plan for P2P. From $4.99/month."
4. **NordVPN** — "Popular choice with large server network. From $3.69/month."
5. **IPVanish** — "Simple setup, unlimited devices. From $3.33/month."
6. **Other / Custom** — "Use any OpenVPN or WireGuard provider. [How to set this up →]"
7. **I already have a VPN** — pre-fill from assessment Q2.5

Link to Gluetun's supported providers list for users who want to check compatibility before choosing.

---

## Port Forwarding (VPN-level)

Some VPN providers support port forwarding through the tunnel, which improves torrent performance (better peer connectivity).

| Provider | Port Forwarding | Notes |
|----------|----------------|-------|
| Mullvad | No (removed in 2023) | Works fine without it, slightly slower peer discovery |
| Surfshark | No | |
| ProtonVPN | Yes (paid plans) | Gluetun supports this via `VPN_PORT_FORWARDING=on` |
| NordVPN | No | |
| IPVanish | No | |

If available, Gluetun can automatically configure the forwarded port and update qBittorrent's listening port.

```yaml
    environment:
      - VPN_PORT_FORWARDING=on  # only for providers that support it
      - VPN_PORT_FORWARDING_PROVIDER=protonvpn
```

---

## Health Check & Kill Switch

Gluetun includes a built-in kill switch — if the VPN connection drops, all traffic from containers using `network_mode: service:gluetun` is blocked. This is critical to prevent IP leaks.

Add a health check to Gluetun so dependent services wait for the VPN to be up:

```yaml
services:
  gluetun:
    # ... other config ...
    healthcheck:
      test: ["CMD", "/gluetun-entrypoint", "healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  qbittorrent:
    # ... other config ...
    network_mode: "service:gluetun"
    depends_on:
      gluetun:
        condition: service_healthy
```

This ensures qBittorrent doesn't start until the VPN tunnel is established.

---

## Testing

The generated README should include verification steps:

```bash
# Check VPN is working (should show VPN provider's IP, not your real IP):
docker exec gluetun wget -qO- https://ipinfo.io

# Check qBittorrent is routed through VPN:
docker exec qbittorrent wget -qO- https://ipinfo.io

# Verify kill switch (stop Gluetun, confirm qBittorrent loses connectivity):
docker stop gluetun
docker exec qbittorrent wget -qO- https://ipinfo.io  # should fail/timeout
docker start gluetun
```
