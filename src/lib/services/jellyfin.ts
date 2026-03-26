import type { ServiceModule, ComposeService } from '$lib/types/configurator';

export const jellyfin: ServiceModule = {
	id: 'jellyfin',
	name: 'Jellyfin',
	description: 'Free, open-source media server. Stream movies, TV, and music to any device.',
	category: 'media-server',
	skillLevel: 'beginner',
	requires: [],
	recommends: ['jellyseerr'],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 8096, container: 8096 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 512, cpuShares: 512, storageGB: 2 },
	compose(config) {
		const volumes = [
			'${CONFIG_DIR}/jellyfin:/config',
			'${MEDIA_DIR}/movies:/movies',
			'${MEDIA_DIR}/tv:/tv'
		];
		if (config.features.music) {
			volumes.push('${MEDIA_DIR}/music:/music');
		}
		const svc: ComposeService = {
			image: 'jellyfin/jellyfin:latest',
			container_name: 'jellyfin',
			environment: [
				'PUID=${PUID}',
				'PGID=${PGID}',
				'TZ=${TZ}'
			],
			volumes,
			ports: ['8096:8096'],
			restart: 'unless-stopped',
			networks: ['media']
		};
		if (config.features.gpuTranscoding) {
			svc.devices = ['/dev/dri:/dev/dri'];
		}
		return { jellyfin: svc };
	}
};
