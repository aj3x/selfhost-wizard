import type { ServiceModule } from '$lib/types/configurator';

export const nzbget: ServiceModule = {
	id: 'nzbget',
	name: 'NZBGet',
	description: 'Lightweight usenet downloader. Alternative to SABnzbd.',
	category: 'download-client',
	skillLevel: 'advanced',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 6789, container: 6789 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			nzbget: {
				image: 'lscr.io/linuxserver/nzbget:latest',
				container_name: 'nzbget',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: [
					'${CONFIG_DIR}/nzbget:/config',
					'${MEDIA_DIR}/downloads:/downloads'
				],
				ports: ['6789:6789'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
