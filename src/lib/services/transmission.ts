import type { ServiceModule, ComposeService } from '$lib/types/configurator';

export const transmission: ServiceModule = {
	id: 'transmission',
	name: 'Transmission',
	description: 'Lightweight torrent client. Simpler alternative to qBittorrent.',
	category: 'download-client',
	skillLevel: 'beginner',
	requires: [],
	recommends: ['gluetun'],
	conflicts: [],
	networks: [],
	ports: [
		{ host: 9091, container: 9091 },
		{ host: 51413, container: 51413 }
	],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	vpnRouted: true,
	compose(config) {
		const base: ComposeService = {
			image: 'lscr.io/linuxserver/transmission:latest',
			container_name: 'transmission',
			environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
			volumes: [
				'${CONFIG_DIR}/transmission:/config',
				'${MEDIA_DIR}/downloads:/downloads'
			],
			restart: 'unless-stopped'
		};

		if (config.features.vpnEnabled) {
			base.network_mode = 'service:gluetun';
			base.depends_on = { gluetun: { condition: 'service_healthy' } };
		} else {
			base.ports = ['9091:9091', '51413:51413', '51413:51413/udp'];
			base.networks = ['media'];
		}

		return { transmission: base };
	}
};
