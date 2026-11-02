import type { ServiceModule, ComposeService } from '$lib/types/configurator';

export const qbittorrent: ServiceModule = {
	id: 'qbittorrent',
	name: 'qBittorrent',
	description: 'Lightweight torrent client with web UI.',
	category: 'download-client',
	skillLevel: 'beginner',
	requires: [],
	recommends: ['gluetun'],
	conflicts: [],
	networks: [],
	ports: [
		{ host: 8080, container: 8080 },
		{ host: 6881, container: 6881 },
		{ host: 6881, container: 6881, protocol: 'udp' }
	],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' },
		{ key: 'WEBUI_PORT', value: '8080' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 0.5 },
	vpnRouted: true,
	compose(config) {
		const base: ComposeService = {
			image: 'lscr.io/linuxserver/qbittorrent:latest',
			container_name: 'qbittorrent',
			environment: [
				'PUID=${PUID}',
				'PGID=${PGID}',
				'TZ=${TZ}',
				'WEBUI_PORT=8080'
			],
			volumes: [
				'${CONFIG_DIR}/qbittorrent:/config',
				'${MEDIA_DIR}/downloads:/downloads'
			],
			restart: 'unless-stopped'
		};

		if (config.features.vpnEnabled) {
			base.network_mode = 'service:gluetun';
			base.depends_on = { gluetun: { condition: 'service_healthy' } };
		} else {
			base.ports = ['8080:8080', '6881:6881', '6881:6881/udp'];
			base.networks = ['media'];
		}

		return { qbittorrent: base };
	}
};
