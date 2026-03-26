import type { ServiceModule } from '$lib/types/configurator';

export const overseerr: ServiceModule = {
	id: 'overseerr',
	name: 'Overseerr',
	description: 'Request management for Plex — let household members request content.',
	category: 'media-management',
	skillLevel: 'beginner',
	requires: [
		{ type: 'all', serviceIds: ['plex'] },
		{
			type: 'one_of',
			serviceIds: ['sonarr', 'radarr'],
			label: 'Sonarr or Radarr',
			defaultId: 'sonarr'
		}
	],
	recommends: [],
	conflicts: ['jellyseerr'],
	networks: ['media'],
	ports: [{ host: 5055, container: 5055 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 0.5 },
	compose() {
		return {
			overseerr: {
				image: 'lscr.io/linuxserver/overseerr:latest',
				container_name: 'overseerr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/overseerr:/config'],
				ports: ['5055:5055'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
