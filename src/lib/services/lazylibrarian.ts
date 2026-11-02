import type { ServiceModule } from '$lib/types/configurator';

export const lazylibrarian: ServiceModule = {
	id: 'lazylibrarian',
	name: 'LazyLibrarian',
	description: 'Automatic audiobook and ebook downloading. Files land in the Audiobookshelf library.',
	category: 'media-management',
	skillLevel: 'intermediate',
	requires: [
		{
			type: 'one_of',
			serviceIds: ['qbittorrent', 'transmission', 'sabnzbd', 'nzbget'],
			label: 'a download client',
			defaultId: 'qbittorrent'
		}
	],
	recommends: ['audiobookshelf'],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 5299, container: 5299 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 0.5 },
	compose() {
		return {
			lazylibrarian: {
				image: 'lscr.io/linuxserver/lazylibrarian:latest',
				container_name: 'lazylibrarian',
				environment: [
					'PUID=${PUID}',
					'PGID=${PGID}',
					'TZ=${TZ}',
					'DOCKER_MODS=linuxserver/mods:lazylibrarian-ffmpeg'
				],
				volumes: [
					'${CONFIG_DIR}/lazylibrarian:/config',
					'${MEDIA_DIR}/downloads:/downloads',
					'${MEDIA_DIR}/audiobooks:/books'
				],
				ports: ['5299:5299'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
