import type { ServiceModule } from '$lib/types/configurator';

export const readarr: ServiceModule = {
	id: 'readarr',
	name: 'Readarr',
	description: 'Automatic book and audiobook downloading and organization.',
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
	ports: [{ host: 8787, container: 8787 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 1 },
	compose() {
		return {
			readarr: {
				image: 'lscr.io/linuxserver/readarr:develop',
				container_name: 'readarr',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/readarr:/config', '${MEDIA_DIR}:/media'],
				ports: ['8787:8787'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
