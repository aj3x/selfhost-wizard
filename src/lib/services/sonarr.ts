import type { ServiceModule } from '$lib/types/configurator';

export const sonarr: ServiceModule = {
	id: 'sonarr',
	name: 'Sonarr',
	description: 'Automatic TV show downloading and organization.',
	category: 'media-management',
	skillLevel: 'intermediate',
	requires: [
		{ type: 'all', serviceIds: ['prowlarr'] },
		{
			type: 'one_of',
			serviceIds: ['qbittorrent', 'transmission', 'sabnzbd', 'nzbget'],
			label: 'a download client',
			defaultId: 'qbittorrent'
		}
	],
	recommends: ['bazarr'],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 8989, container: 8989 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 1 },
	compose() {
		return {
			sonarr: {
				image: 'lscr.io/linuxserver/sonarr:latest',
				container_name: 'sonarr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/sonarr:/config', '${MEDIA_DIR}:/media'],
				ports: ['8989:8989'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
