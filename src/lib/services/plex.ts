import type { ServiceModule } from '$lib/types/configurator';

export const plex: ServiceModule = {
	id: 'plex',
	name: 'Plex',
	description: 'Polished media server with great apps. Plex Pass unlocks extra features.',
	category: 'media-server',
	skillLevel: 'beginner',
	requires: [],
	recommends: ['seerr', 'tautulli'],
	conflicts: [],
	networks: [],
	ports: [{ host: 32400, container: 32400 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' },
		{ key: 'VERSION', value: 'docker' },
		{ key: 'PLEX_CLAIM', description: 'Claim token from plex.tv/claim (optional)' }
	],
	resourceEstimate: { ramMB: 1024, cpuShares: 1024, storageGB: 5 },
	compose(config) {
		const volumes = [
			'${CONFIG_DIR}/plex:/config',
			'${MEDIA_DIR}/movies:/movies',
			'${MEDIA_DIR}/tv:/tv'
		];
		if (config.features.music) {
			volumes.push('${MEDIA_DIR}/music:/music');
		}
		const environment = [
			'PUID=${PUID}',
			'PGID=${PGID}',
			'TZ=${TZ}',
			'VERSION=docker'
		];
		if (config.env.PLEX_CLAIM) {
			environment.push('PLEX_CLAIM=${PLEX_CLAIM}');
		}
		return {
			plex: {
				image: 'lscr.io/linuxserver/plex:latest',
				container_name: 'plex',
				network_mode: 'host',
				environment,
				volumes,
				restart: 'unless-stopped'
			}
		};
	}
};
