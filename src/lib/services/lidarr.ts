import type { ServiceModule } from '$lib/types/configurator';

export const lidarr: ServiceModule = {
	id: 'lidarr',
	name: 'Lidarr',
	description: 'Automatic music downloading and organization.',
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
	recommends: [],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 8686, container: 8686 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 1 },
	compose() {
		return {
			lidarr: {
				image: 'lscr.io/linuxserver/lidarr:latest',
				container_name: 'lidarr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/lidarr:/config', '${MEDIA_DIR}:/media'],
				ports: ['8686:8686'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
