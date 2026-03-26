import type { ServiceModule } from '$lib/types/configurator';

export const bazarr: ServiceModule = {
	id: 'bazarr',
	name: 'Bazarr',
	description: 'Automatic subtitle downloading for movies and TV shows.',
	category: 'media-management',
	skillLevel: 'beginner',
	requires: [
		{
			type: 'one_of',
			serviceIds: ['sonarr', 'radarr'],
			label: 'Sonarr or Radarr',
			defaultId: 'sonarr'
		}
	],
	recommends: [],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 6767, container: 6767 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			bazarr: {
				image: 'lscr.io/linuxserver/bazarr:latest',
				container_name: 'bazarr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: [
					'${CONFIG_DIR}/bazarr:/config',
					'${MEDIA_DIR}/movies:/movies',
					'${MEDIA_DIR}/tv:/tv'
				],
				ports: ['6767:6767'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
