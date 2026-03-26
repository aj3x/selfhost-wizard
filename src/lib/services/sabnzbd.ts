import type { ServiceModule } from '$lib/types/configurator';

export const sabnzbd: ServiceModule = {
	id: 'sabnzbd',
	name: 'SABnzbd',
	description: 'Usenet downloader. Does not need VPN — traffic is already encrypted.',
	category: 'download-client',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 8081, container: 8080 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 0.5 },
	compose() {
		return {
			sabnzbd: {
				image: 'lscr.io/linuxserver/sabnzbd:latest',
				container_name: 'sabnzbd',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: [
					'${CONFIG_DIR}/sabnzbd:/config',
					'${MEDIA_DIR}/downloads:/downloads'
				],
				ports: ['8081:8080'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
