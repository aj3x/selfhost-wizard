import type { ServiceModule } from '$lib/types/configurator';

export const prowlarr: ServiceModule = {
	id: 'prowlarr',
	name: 'Prowlarr',
	description: 'Centralized indexer manager for all *arr apps.',
	category: 'media-management',
	skillLevel: 'intermediate',
	requires: [
		{
			type: 'one_of',
			serviceIds: ['sonarr', 'radarr', 'lidarr', 'readarr'],
			label: 'an *arr app',
			defaultId: 'sonarr'
		}
	],
	recommends: ['sonarr', 'radarr'],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 9696, container: 9696 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			prowlarr: {
				image: 'lscr.io/linuxserver/prowlarr:latest',
				container_name: 'prowlarr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/prowlarr:/config'],
				ports: ['9696:9696'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
