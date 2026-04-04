import type { ServiceModule } from '$lib/types/configurator';

export const ombi: ServiceModule = {
	id: 'ombi',
	name: 'Ombi',
	description: 'Older request management tool. Supports Plex, Jellyfin, and Emby.',
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
	conflicts: ['seerr'],
	conflictReason: 'Ombi is a mature alternative. Seerr (recommended) has a more modern UI and faster development.',
	networks: ['media'],
	ports: [{ host: 3579, container: 3579 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 0.5 },
	compose() {
		return {
			ombi: {
				image: 'lscr.io/linuxserver/ombi:latest',
				container_name: 'ombi',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/ombi:/config'],
				ports: ['3579:3579'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
