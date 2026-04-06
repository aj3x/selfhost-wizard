import type { ServiceModule, ServiceCategory } from '$lib/types/configurator';
import { SERVICE_CATEGORY_ORDER, SERVICE_CATEGORY_LABELS } from '$lib/types/configurator';

// Media Server
import { jellyfin } from './jellyfin';
import { plex } from './plex';

// Media Management
import { sonarr } from './sonarr';
import { radarr } from './radarr';
import { lidarr } from './lidarr';
import { readarr } from './readarr';
import { bazarr } from './bazarr';
import { prowlarr } from './prowlarr';
import { seerr } from './seerr';
import { ombi } from './ombi';
import { tautulli } from './tautulli';

// Download Clients
import { qbittorrent } from './qbittorrent';
import { transmission } from './transmission';
import { sabnzbd } from './sabnzbd';
import { nzbget } from './nzbget';

// Media Processing
import { tdarr } from './tdarr';

// Photos
import { immich } from './immich';

// Files & Sync
import { nextcloud } from './nextcloud';
import { syncthing } from './syncthing';
import { filebrowser } from './filebrowser';

// Backup
import { duplicati } from './duplicati';
import { kopia } from './kopia';

// Networking
import { gluetun } from './gluetun';
import { tailscale } from './tailscale';
import { caddy } from './caddy';
import { nginxProxyManager } from './nginx-proxy-manager';

// DNS & Ad Blocking
import { adguard } from './adguard';

// Authentication
import { authelia } from './authelia';

// Home Automation
import { homeAssistant } from './home-assistant';

// Productivity
import { vaultwarden } from './vaultwarden';
import { paperless } from './paperless';
import { mealie } from './mealie';

// Monitoring
import { homepage } from './homepage';
import { portainer } from './portainer';
import { uptimeKuma } from './uptime-kuma';

/** All registered services */
const ALL_SERVICES: ServiceModule[] = [
	// Media Server
	jellyfin, plex,
	// Media Management
	sonarr, radarr, lidarr, readarr, bazarr, prowlarr, seerr, ombi, tautulli,
	// Download Clients
	qbittorrent, transmission, sabnzbd, nzbget,
	// Media Processing
	tdarr,
	// Photos
	immich,
	// Files & Sync
	nextcloud, syncthing, filebrowser,
	// Backup
	duplicati, kopia,
	// Networking
	gluetun, tailscale, caddy, nginxProxyManager,
	// DNS & Ad Blocking
	adguard,
	// Authentication
	authelia,
	// Home Automation
	homeAssistant,
	// Productivity
	vaultwarden, paperless, mealie,
	// Monitoring
	homepage, portainer, uptimeKuma
];

/** Lookup service by ID */
const SERVICE_MAP = new Map<string, ServiceModule>(
	ALL_SERVICES.map((s) => [s.id, s])
);

/** Get a service by ID. Throws if not found. */
export function getService(id: string): ServiceModule {
	const svc = SERVICE_MAP.get(id);
	if (!svc) throw new Error(`Unknown service: ${id}`);
	return svc;
}

/** Get a service by ID, or undefined if not found. */
export function findService(id: string): ServiceModule | undefined {
	return SERVICE_MAP.get(id);
}

/** Get all registered services. */
export function getAllServices(): ServiceModule[] {
	return ALL_SERVICES;
}

/** Get all service IDs. */
export function getAllServiceIds(): string[] {
	return ALL_SERVICES.map((s) => s.id);
}

/** Get services grouped by category, in display order. */
export function getServicesByCategory(): { category: ServiceCategory; label: string; services: ServiceModule[] }[] {
	return SERVICE_CATEGORY_ORDER
		.map((cat) => ({
			category: cat,
			label: SERVICE_CATEGORY_LABELS[cat],
			services: ALL_SERVICES.filter((s) => s.category === cat)
		}))
		.filter((group) => group.services.length > 0);
}
