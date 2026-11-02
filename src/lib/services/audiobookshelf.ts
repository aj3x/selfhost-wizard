import type { ServiceModule } from '$lib/types/configurator';

export const audiobookshelf: ServiceModule = {
	id: 'audiobookshelf',
	name: 'Audiobookshelf',
	description: 'Audiobook and podcast server with mobile apps, progress sync, and podcast downloads.',
	category: 'media-server',
	skillLevel: 'beginner',
	requires: [],
	recommends: ['lazylibrarian'],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 13378, container: 80 }],
	environment: [{ key: 'TZ', value: '${TZ}' }],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 1 },
	compose() {
		return {
			audiobookshelf: {
				image: 'ghcr.io/advplyr/audiobookshelf:latest',
				container_name: 'audiobookshelf',
				// Ignores PUID/PGID, so file ownership is set with user instead
				user: '${PUID}:${PGID}',
				environment: ['TZ=${TZ}'],
				volumes: [
					'${CONFIG_DIR}/audiobookshelf/config:/config',
					'${CONFIG_DIR}/audiobookshelf/metadata:/metadata',
					'${MEDIA_DIR}/audiobooks:/audiobooks',
					'${MEDIA_DIR}/podcasts:/podcasts'
				],
				ports: ['13378:80'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
