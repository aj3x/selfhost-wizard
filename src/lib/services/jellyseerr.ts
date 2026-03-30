import type { ServiceModule } from '$lib/types/configurator';

export const jellyseerr: ServiceModule = {
	id: 'jellyseerr',
	name: 'Jellyseerr',
	description: 'Let household members request movies and shows through a clean UI.',
	category: 'media-management',
	skillLevel: 'beginner',
	requires: [
		{ type: 'all', serviceIds: ['jellyfin'] },
		{
			type: 'one_of',
			serviceIds: ['sonarr', 'radarr'],
			label: 'Sonarr or Radarr',
			defaultId: 'sonarr'
		}
	],
	recommends: [],
	conflicts: ['overseerr'],
	conflictReason: 'Jellyseerr is a fork of Overseerr with Jellyfin support. Choose Overseerr if you use Plex.',
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
			jellyseerr: {
				image: 'fallenbagel/jellyseerr:latest',
				container_name: 'jellyseerr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/jellyseerr:/app/config'],
				ports: ['5055:5055'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
