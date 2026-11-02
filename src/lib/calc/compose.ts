import type {
	ConfiguratorState,
	ServiceConfig,
	ComposeService,
	GeneratedOutput
} from '$lib/types/configurator';
import { findService } from '$lib/services/registry';

/** Reverse proxy targets: compose service name and container port, not the host port */
const PROXY_TARGETS: Record<string, { sub: string; service: string; port: number }> = {
	jellyfin: { sub: 'media', service: 'jellyfin', port: 8096 },
	plex: { sub: 'plex', service: 'plex', port: 32400 },
	audiobookshelf: { sub: 'audiobooks', service: 'audiobookshelf', port: 80 },
	sonarr: { sub: 'sonarr', service: 'sonarr', port: 8989 },
	radarr: { sub: 'radarr', service: 'radarr', port: 7878 },
	prowlarr: { sub: 'prowlarr', service: 'prowlarr', port: 9696 },
	seerr: { sub: 'requests', service: 'seerr', port: 5055 },
	ombi: { sub: 'requests', service: 'ombi', port: 3579 },
	immich: { sub: 'photos', service: 'immich-server', port: 2283 },
	photoprism: { sub: 'photos', service: 'photoprism', port: 2342 },
	nextcloud: { sub: 'files', service: 'nextcloud', port: 80 },
	homepage: { sub: 'home', service: 'homepage', port: 3000 },
	portainer: { sub: 'portainer', service: 'portainer', port: 9000 },
	vaultwarden: { sub: 'vault', service: 'vaultwarden', port: 80 },
	paperless: { sub: 'docs', service: 'paperless', port: 8000 },
	mealie: { sub: 'recipes', service: 'mealie', port: 9000 },
	'uptime-kuma': { sub: 'status', service: 'uptime-kuma', port: 3001 },
	adguard: { sub: 'adguard', service: 'adguard', port: 80 },
	'home-assistant': { sub: 'hass', service: 'home-assistant', port: 8123 }
};

const HOST_GATEWAY = 'host.docker.internal';

const MEDIA_CATEGORIES = ['media-server', 'media-management', 'download-client', 'media-processing'];

/**
 * Build a ServiceConfig from the configurator state.
 */
function buildServiceConfig(state: ConfiguratorState, serviceId: string, allIds: string[]): ServiceConfig {
	const gc = state.globalConfig;
	return {
		puid: gc.puid,
		pgid: gc.pgid,
		tz: gc.tz,
		baseDir: gc.baseDir,
		mediaDir: gc.mediaDir,
		configDir: gc.configDir,
		photoDir: gc.photoDir,
		filesDir: gc.filesDir,
		backupDir: gc.backupDir,
		env: {
			...(serviceId === 'gluetun' ? gc.vpnEnv : {}),
			...(state.serviceEnv[serviceId] || {}),
			VPN_PROVIDER: gc.vpnProvider || '',
			VPN_TYPE: gc.vpnType,
			VPN_COUNTRY: gc.vpnCountry,
			HOSTNAME: gc.hostname
		},
		features: {
			music: allIds.includes('lidarr'),
			gpuTranscoding: (state.serviceEnv['global']?.GPU_TRANSCODING === 'true'),
			vpnEnabled: allIds.includes('gluetun')
		}
	};
}

function getAllServiceIds(state: ConfiguratorState): string[] {
	return [...new Set([...state.selectedServices, ...state.resolvedDependencies])];
}

/**
 * Generate the complete docker-compose structure.
 */
export function generateCompose(state: ConfiguratorState): Record<string, ComposeService> {
	const allIds = getAllServiceIds(state);
	const services: Record<string, ComposeService> = {};
	const vpnRoutedPorts: string[] = [];

	for (const id of allIds) {
		const svc = findService(id);
		if (!svc) continue;

		const config = buildServiceConfig(state, id, allIds);
		const fragments = svc.compose(config);

		for (const [name, fragment] of Object.entries(fragments)) {
			services[name] = fragment;
		}

		// Collect ports from VPN-routed services to add to gluetun
		// Read from static metadata since the compose function strips ports when VPN is enabled
		if (svc.vpnRouted && config.features.vpnEnabled) {
			for (const p of svc.ports) {
				vpnRoutedPorts.push(`${p.host}:${p.container}${p.protocol === 'udp' ? '/udp' : ''}`);
			}
		}
	}

	// Add VPN-routed ports to gluetun
	if (services.gluetun && vpnRoutedPorts.length > 0) {
		services.gluetun.ports = [...(services.gluetun.ports || []), ...vpnRoutedPorts];
	}

	connectReverseProxies(services, allIds);

	return services;
}

/**
 * Put reverse proxies on the networks of the services they front, since each
 * stack is otherwise isolated on its own network. Host-mode services are
 * reached through the Docker host gateway.
 */
function connectReverseProxies(services: Record<string, ComposeService>, allIds: string[]): void {
	const networks = new Set<string>();
	let needsHostGateway = false;

	for (const id of allIds) {
		const target = PROXY_TARGETS[id];
		const svc = target && services[target.service];
		if (!svc) continue;

		if (svc.network_mode === 'host') {
			needsHostGateway = true;
		} else if (svc.networks?.length) {
			svc.networks.forEach((n) => networks.add(n));
		} else {
			networks.add('default');
		}
	}

	for (const proxy of [services.caddy, services['nginx-proxy-manager']]) {
		if (!proxy) continue;
		proxy.networks = [...new Set([...(proxy.networks ?? []), ...networks])];
		if (needsHostGateway) proxy.extra_hosts = [`${HOST_GATEWAY}:host-gateway`];
	}
}

/**
 * Collect all docker networks needed by the selected services.
 */
export function collectNetworks(services: Record<string, ComposeService>): string[] {
	const networks = new Set<string>();
	for (const svc of Object.values(services)) {
		if (svc.networks) {
			for (const net of svc.networks) {
				// Compose provides the default network implicitly
				if (net !== 'default') networks.add(net);
			}
		}
	}
	return [...networks].sort();
}

/** Quote a user-provided .env value so compose reads it literally */
function envValue(value: string): string {
	return /^[\w@%+=:,./-]*$/.test(value) ? value : `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Resolve a secret: the user's override wins over the generated value */
function getSecret(state: ConfiguratorState, serviceId: string, key: string): string {
	return envValue(state.serviceEnv[serviceId]?.[key] || state.generatedSecrets[key] || '');
}

/**
 * Generate the .env file contents.
 */
export function generateEnvFile(state: ConfiguratorState): string {
	const gc = state.globalConfig;
	const lines: string[] = [
		'# Generated by SelfHost Wizard',
		'# Modify these values to match your system',
		'',
		'# ── System ──',
		`PUID=${gc.puid}`,
		`PGID=${gc.pgid}`,
		`TZ=${gc.tz}`,
		`HOSTNAME=${gc.hostname}`,
		'',
		'# ── Paths ──',
		`BASE_DIR=${gc.baseDir}`,
		`CONFIG_DIR=${gc.configDir}`,
		`MEDIA_DIR=${gc.mediaDir}`,
		`PHOTO_DIR=${gc.photoDir}`,
		`FILES_DIR=${gc.filesDir}`,
		`BACKUP_DIR=${gc.backupDir}`,
	];

	const allIds = getAllServiceIds(state);

	// VPN settings
	if (allIds.includes('gluetun') && gc.vpnProvider) {
		lines.push('', '# ── VPN ──');
		const providerName = gc.vpnProvider === 'custom'
			? (gc.vpnEnv['VPN_SERVICE_PROVIDER'] || 'custom')
			: gc.vpnProvider;
		lines.push(`VPN_PROVIDER=${providerName}`);
		lines.push(`VPN_TYPE=${gc.vpnType}`);
		if (gc.vpnCountry) lines.push(`VPN_COUNTRY=${gc.vpnCountry}`);
		for (const [key, val] of Object.entries(gc.vpnEnv)) {
			if (key === 'VPN_SERVICE_PROVIDER') continue;
			lines.push(`${key}=${envValue(val)}`);
		}
	}

	// Reverse proxy settings
	if (gc.domain) {
		lines.push('', '# ── Domain ──');
		lines.push(`DOMAIN=${gc.domain}`);
		if (gc.email) lines.push(`EMAIL=${gc.email}`);
	}

	// Plex claim
	if (allIds.includes('plex')) {
		const plexClaim = state.serviceEnv['plex']?.PLEX_CLAIM || '';
		lines.push('', '# ── Plex ──');
		lines.push(`PLEX_CLAIM=${envValue(plexClaim)}`);
	}

	// Tailscale
	if (allIds.includes('tailscale')) {
		const authKey = state.serviceEnv['tailscale']?.TS_AUTHKEY || 'your-tailscale-auth-key';
		lines.push('', '# ── Tailscale ──');
		lines.push(`TS_AUTHKEY=${envValue(authKey)}`);
	}

	// Immich DB
	if (allIds.includes('immich')) {
		lines.push('', '# ── Immich ──');
		lines.push(`IMMICH_DB_PASSWORD=${getSecret(state, 'immich', 'IMMICH_DB_PASSWORD')}`);
		lines.push('IMMICH_DB_USER=postgres');
		lines.push('IMMICH_DB_NAME=immich');
	}

	// Nextcloud DB
	if (allIds.includes('nextcloud')) {
		lines.push('', '# ── Nextcloud ──');
		lines.push(`NC_DB_PASSWORD=${getSecret(state, 'nextcloud', 'NC_DB_PASSWORD')}`);
		lines.push('NC_DB_USER=nextcloud');
		lines.push('NC_DB_NAME=nextcloud');
	}

	// Paperless DB
	if (allIds.includes('paperless')) {
		lines.push('', '# ── Paperless ──');
		lines.push(`PAPERLESS_DB_PASSWORD=${getSecret(state, 'paperless', 'PAPERLESS_DB_PASSWORD')}`);
	}

	// PhotoPrism admin
	if (allIds.includes('photoprism')) {
		lines.push('', '# ── PhotoPrism ──');
		lines.push(`PHOTOPRISM_ADMIN_PASSWORD=${getSecret(state, 'photoprism', 'PHOTOPRISM_ADMIN_PASSWORD')}`);
	}

	return lines.join('\n') + '\n';
}

/**
 * Generate the setup.sh script.
 */
export function generateSetupScript(state: ConfiguratorState): string {
	const gc = state.globalConfig;
	const allIds = getAllServiceIds(state);
	const expand = (dir: string) => dir.replace('${BASE_DIR}', gc.baseDir);
	const configBase = expand(gc.configDir);
	const mediaBase = expand(gc.mediaDir);
	const filesBase = expand(gc.filesDir);
	const dirs: string[] = [configBase, mediaBase];

	// Add service-specific config dirs
	for (const id of allIds) {
		if (findService(id)) dirs.push(`${configBase}/${id}`);
	}

	// Add media subdirs
	if (allIds.some((id) => MEDIA_CATEGORIES.includes(findService(id)?.category ?? ''))) {
		dirs.push(`${mediaBase}/movies`, `${mediaBase}/tv`, `${mediaBase}/downloads`, `${mediaBase}/downloads/complete`, `${mediaBase}/downloads/incomplete`);
		if (allIds.includes('lidarr')) {
			dirs.push(`${mediaBase}/music`);
		}
		if (allIds.some((id) => ['audiobookshelf', 'lazylibrarian'].includes(id))) {
			dirs.push(`${mediaBase}/audiobooks`, `${mediaBase}/podcasts`);
		}
		if (allIds.includes('audiobookshelf')) {
			dirs.push(`${configBase}/audiobookshelf/config`, `${configBase}/audiobookshelf/metadata`);
		}
	}

	if (allIds.some((id) => ['immich', 'photoprism'].includes(id))) {
		dirs.push(expand(gc.photoDir));
	}

	if (allIds.some((id) => ['nextcloud', 'syncthing', 'filebrowser', 'paperless'].includes(id))) {
		dirs.push(filesBase);
	}
	if (allIds.includes('syncthing')) dirs.push(`${filesBase}/sync`);
	if (allIds.includes('paperless')) dirs.push(`${filesBase}/paperless/consume`);

	if (allIds.some((id) => ['duplicati', 'kopia'].includes(id))) {
		dirs.push(expand(gc.backupDir));
	}

	const uniqueDirs = [...new Set(dirs)].sort();

	const lines = [
		'#!/bin/bash',
		'# SelfHost Wizard — Setup Script',
		'# Generated automatically. Review before running.',
		'',
		'set -euo pipefail',
		'',
		'# Run from the folder holding docker-compose.yml and .env',
		'cd "$(dirname "$0")"',
		'',
		'# Check for Docker',
		'if ! command -v docker &> /dev/null; then',
		'  echo "ERROR: Docker is not installed."',
		'  echo "  Install it from https://docs.docker.com/engine/install/"',
		'  exit 1',
		'fi',
		'',
		'if ! docker compose version &> /dev/null; then',
		'  echo "ERROR: Docker Compose V2 is not installed."',
		'  echo "  Install it from https://docs.docker.com/compose/install/"',
		'  exit 1',
		'fi',
		'',
		'echo "Docker $(docker --version | cut -d\' \' -f3) detected."',
		'',
		`PUID=${gc.puid}`,
		`PGID=${gc.pgid}`,
		'',
		'echo "Creating directory structure..."',
		`mkdir -p \\`,
		...uniqueDirs.map((d, i) => `  "${d}"${i < uniqueDirs.length - 1 ? ' \\' : ''}`),
		'',
		// Bind-mounted files must exist first, or Docker creates directories in their place
		...(allIds.includes('caddy') ? [
			'if [ -f Caddyfile ]; then',
			`  cp Caddyfile "${configBase}/caddy/Caddyfile"`,
			'fi',
			''
		] : []),
		...(allIds.includes('filebrowser') ? [
			`touch "${configBase}/filebrowser/database.db"`,
			`if [ ! -f "${configBase}/filebrowser/.filebrowser.json" ]; then`,
			`  echo '{"port": 80, "baseURL": "", "address": "", "log": "stdout", "database": "/database.db", "root": "/srv"}' > "${configBase}/filebrowser/.filebrowser.json"`,
			'fi',
			''
		] : []),
		'echo "Setting ownership..."',
		// Directories may be customized to live outside the base directory
		`chown -R "$PUID:$PGID" \\`,
		...uniqueDirs.map((d, i) => `  "${d}"${i < uniqueDirs.length - 1 ? ' \\' : ''}`),
		''
	];

	// --- Post-boot media setup ---
	const hasSonarr = allIds.includes('sonarr');
	const hasRadarr = allIds.includes('radarr');
	const hasRecyclarr = allIds.includes('recyclarr');

	if (hasSonarr || hasRadarr || hasRecyclarr) {
		lines.push(
			'# ── Auto-configure media services ──',
			'',
			'if ! command -v curl &> /dev/null; then',
			'  echo "ERROR: curl is required to configure media services."',
			'  exit 1',
			'fi',
			'',
			'echo ""',
			'echo "Starting containers for initial configuration..."',
			'docker compose up -d',
			'',
			'# Wait for services to become healthy',
			'wait_for_service() {',
			'  local name="$1"',
			'  local url="$2"',
			'  local max_attempts=30',
			'  local attempt=0',
			'  echo -n "Waiting for $name..."',
			'  while [ $attempt -lt $max_attempts ]; do',
			'    if curl -sf "$url" > /dev/null 2>&1; then',
			'      echo " ready!"',
			'      return 0',
			'    fi',
			'    echo -n "."',
			'    sleep 2',
			'    attempt=$((attempt + 1))',
			'  done',
			'  echo " timed out (will need manual setup)"',
			'  return 1',
			'}',
			'',
			'# Get API key from a running *arr service config.xml',
			'get_api_key() {',
			'  local container="$1"',
			'  local config_path="$2"',
			'  docker exec "$container" cat "$config_path" 2>/dev/null | grep -oP \'(?<=<ApiKey>)[^<]+\' || echo ""',
			'}',
			'',
			'# Set a root folder on an *arr service. Failures never abort the rest of setup.',
			'configure_root_folder() {',
			'  local name="$1" container="$2" port="$3" path="$4"',
			'  # /ping needs no API key, unlike the /api endpoints',
			'  wait_for_service "$name" "http://localhost:$port/ping" || return 0',
			'  local key existing',
			'  key=$(get_api_key "$container" "/config/config.xml")',
			'  if [ -z "$key" ]; then',
			'    echo "$name: could not read API key, skipping root folder setup"',
			'    return 0',
			'  fi',
			'  existing=$(curl -sf "http://localhost:$port/api/v3/rootfolder" -H "X-Api-Key: $key" || echo "")',
			'  if [ "$existing" != "[]" ]; then',
			'    echo "$name: root folder already configured or unavailable, skipping"',
			'    return 0',
			'  fi',
			'  if curl -sf -X POST "http://localhost:$port/api/v3/rootfolder" \\',
			'    -H "X-Api-Key: $key" \\',
			'    -H "Content-Type: application/json" \\',
			`    -d "{\\"path\\": \\"$path\\"}" > /dev/null; then`,
			'    echo "$name: root folder set to $path"',
			'  else',
			'    echo "$name: could not set root folder, set it manually in the web UI"',
			'  fi',
			'}',
			''
		);

		if (hasRadarr) {
			lines.push(`configure_root_folder "Radarr" "radarr" 7878 "${gc.moviesPath}"`, '');
		}

		if (hasSonarr) {
			lines.push(`configure_root_folder "Sonarr" "sonarr" 8989 "${gc.tvPath}"`, '');
		}

		if (hasRecyclarr) {
			lines.push(
				'# Sync TRaSH Guides quality profiles via Recyclarr',
				'echo "Running Recyclarr sync..."',
				'docker compose run --rm recyclarr sync || echo "Recyclarr sync failed — you can run it manually later with: docker compose run --rm recyclarr sync"',
				''
			);
		}
	}

	lines.push(
		'echo ""',
		'echo "Done! Next steps:"',
	);

	if (hasSonarr || hasRadarr || hasRecyclarr) {
		lines.push(
			'echo "  1. Your containers are already running"',
			'echo "  2. Access services at the ports listed in docker-compose.yml"'
		);
	} else {
		lines.push(
			'echo "  1. Run: docker compose up -d"',
			'echo "  2. Access services at the ports listed in docker-compose.yml"'
		);
	}

	lines.push('');
	return lines.join('\n');
}

/**
 * Serialize compose services to YAML string.
 */
export function toComposeYaml(services: Record<string, ComposeService>, networks: string[]): string {
	const lines: string[] = [];

	lines.push('# Generated by SelfHost Wizard');
	lines.push('# https://alexrussell.dev/selfhost-wizard');
	lines.push('');
	lines.push('services:');

	for (const [name, svc] of Object.entries(services)) {
		lines.push(`  ${name}:`);
		lines.push(`    image: ${svc.image}`);
		lines.push(`    container_name: ${svc.container_name}`);

		if (svc.user) {
			lines.push(`    user: "${svc.user}"`);
		}

		if (svc.hostname) {
			lines.push(`    hostname: ${svc.hostname}`);
		}

		if (svc.extra_hosts && svc.extra_hosts.length > 0) {
			lines.push('    extra_hosts:');
			for (const host of svc.extra_hosts) {
				lines.push(`      - "${host}"`);
			}
		}

		if (svc.network_mode) {
			lines.push(`    network_mode: "${svc.network_mode}"`);
		}

		if (svc.cap_add && svc.cap_add.length > 0) {
			lines.push('    cap_add:');
			for (const cap of svc.cap_add) {
				lines.push(`      - ${cap}`);
			}
		}

		if (svc.devices && svc.devices.length > 0) {
			lines.push('    devices:');
			for (const dev of svc.devices) {
				lines.push(`      - ${dev}`);
			}
		}

		if (svc.environment && svc.environment.length > 0) {
			lines.push('    environment:');
			for (const env of svc.environment) {
				lines.push(`      - ${env}`);
			}
		}

		if (svc.volumes && svc.volumes.length > 0) {
			lines.push('    volumes:');
			for (const vol of svc.volumes) {
				lines.push(`      - ${vol}`);
			}
		}

		if (svc.ports && svc.ports.length > 0) {
			lines.push('    ports:');
			for (const port of svc.ports) {
				lines.push(`      - "${port}"`);
			}
		}

		if (svc.depends_on) {
			if (Array.isArray(svc.depends_on)) {
				lines.push('    depends_on:');
				for (const dep of svc.depends_on) {
					lines.push(`      - ${dep}`);
				}
			} else {
				lines.push('    depends_on:');
				for (const [dep, cond] of Object.entries(svc.depends_on)) {
					lines.push(`      ${dep}:`);
					lines.push(`        condition: ${cond.condition}`);
				}
			}
		}

		if (svc.healthcheck) {
			lines.push('    healthcheck:');
			lines.push(`      test: ${JSON.stringify(svc.healthcheck.test)}`);
			lines.push(`      interval: ${svc.healthcheck.interval}`);
			lines.push(`      timeout: ${svc.healthcheck.timeout}`);
			lines.push(`      retries: ${svc.healthcheck.retries}`);
			if (svc.healthcheck.start_period) {
				lines.push(`      start_period: ${svc.healthcheck.start_period}`);
			}
		}

		if (svc.restart) {
			lines.push(`    restart: ${svc.restart}`);
		}

		if (svc.networks && svc.networks.length > 0) {
			lines.push('    networks:');
			for (const net of svc.networks) {
				lines.push(`      - ${net}`);
			}
		}

		lines.push('');
	}

	// Networks section
	if (networks.length > 0) {
		lines.push('networks:');
		for (const net of networks) {
			lines.push(`  ${net}:`);
			lines.push('    driver: bridge');
		}
	}

	return lines.join('\n') + '\n';
}

/**
 * Generate all output files.
 */
export function generateAll(state: ConfiguratorState): GeneratedOutput {
	const services = generateCompose(state);
	const networks = collectNetworks(services);
	const composeYaml = toComposeYaml(services, networks);
	const envFile = generateEnvFile(state);
	const setupScript = generateSetupScript(state);

	// Generate Caddyfile if Caddy is selected
	let caddyfile: string | null = null;
	const allIds = getAllServiceIds(state);
	if (allIds.includes('caddy') && state.globalConfig.domain) {
		caddyfile = generateCaddyfile(state, services);
	}

	const readme = generateReadme(state, allIds);

	return { composeYaml, envFile, setupScript, caddyfile, readme };
}

function generateCaddyfile(
	state: ConfiguratorState,
	services: Record<string, ComposeService>
): string {
	const { domain, email } = state.globalConfig;
	const lines: string[] = [
		`# Caddyfile generated by SelfHost Wizard`,
		''
	];

	if (email) {
		lines.push('{', `  email ${email}`, '}', '');
	}

	for (const id of getAllServiceIds(state)) {
		const target = PROXY_TARGETS[id];
		const svc = target && services[target.service];
		if (!svc) continue;

		const host = svc.network_mode === 'host' ? HOST_GATEWAY : target.service;
		lines.push(`${target.sub}.${domain} {`);
		lines.push(`  reverse_proxy ${host}:${target.port}`);
		lines.push('}');
		lines.push('');
	}

	return lines.join('\n');
}

function generateReadme(state: ConfiguratorState, allIds: string[]): string {
	const gc = state.globalConfig;
	const lines: string[] = [
		'# SelfHost Wizard — Your Server Setup',
		'',
		'Generated by [SelfHost Wizard](https://alexrussell.dev/selfhost-wizard)',
		'',
		'## Quick Start',
		'',
		'```bash',
		'# 1. Edit .env with your credentials',
		'nano .env',
		'',
		'# 2. Create directory structure',
		'sudo bash setup.sh',
		'',
		'# 3. Start all services',
		'docker compose up -d',
		'```',
		'',
		'## Services',
		'',
		'| Service | URL | Description |',
		'|---------|-----|-------------|'
	];

	for (const id of allIds) {
		const svc = findService(id);
		if (!svc || svc.ports.length === 0) continue;
		const port = svc.ports[0].host;
		lines.push(`| ${svc.name} | http://localhost:${port} | ${svc.description} |`);
	}

	if (allIds.includes('gluetun')) {
		lines.push('', '## VPN Verification', '');
		lines.push('```bash');
		lines.push('# Verify VPN is working (should show VPN IP, not your real IP):');
		lines.push('docker exec gluetun wget -qO- https://ipinfo.io');
		lines.push('```');
	}

	return lines.join('\n') + '\n';
}
