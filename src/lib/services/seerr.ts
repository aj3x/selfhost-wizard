import type { ServiceModule } from '$lib/types/configurator';

export const seerr: ServiceModule = {
	id: 'seerr',
	name: 'Seerr',
	description: 'Let household members request movies and shows. Works with Jellyfin and Plex.',
	category: 'media-management',
	skillLevel: 'beginner',
	requires: [
		{
			type: 'one_of',
			serviceIds: ['jellyfin', 'plex'],
			label: 'a media server',
			defaultId: 'jellyfin'
		},
		{
			type: 'one_of',
			serviceIds: ['sonarr', 'radarr'],
			label: 'Sonarr or Radarr',
			defaultId: 'sonarr'
		}
	],
	recommends: [],
	conflicts: ['ombi'],
	conflictReason: 'Seerr has a modern UI and is actively maintained. Ombi is an older alternative with broader integrations.',
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
			seerr: {
				image: 'fallenbagel/jellyseerr:latest',
				container_name: 'seerr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/seerr:/app/config'],
				ports: ['5055:5055'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
