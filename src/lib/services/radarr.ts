import type { ServiceModule } from '$lib/types/configurator';

export const radarr: ServiceModule = {
	id: 'radarr',
	name: 'Radarr',
	description: 'Automatic movie downloading and organization.',
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
	ports: [{ host: 7878, container: 7878 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 1 },
	compose() {
		return {
			radarr: {
				image: 'lscr.io/linuxserver/radarr:latest',
				container_name: 'radarr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/radarr:/config', '${MEDIA_DIR}:/media'],
				ports: ['7878:7878'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
