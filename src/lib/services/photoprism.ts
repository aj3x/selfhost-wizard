import type { ServiceModule } from '$lib/types/configurator';

export const photoprism: ServiceModule = {
	id: 'photoprism',
	name: 'PhotoPrism',
	description: 'AI-powered photo management with automatic tagging, maps, and face recognition. Lighter than Immich.',
	category: 'photos',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: ['immich'],
	conflictReason: 'Both are photo management platforms. Pick one to avoid duplicating storage and indexing.',
	networks: [],
	ports: [{ host: 2342, container: 2342 }],
	environment: [
		{ key: 'PHOTOPRISM_ADMIN_PASSWORD', description: 'PhotoPrism admin password', required: true, secret: true }
	],
	resourceEstimate: { ramMB: 1024, cpuShares: 512, storageGB: 2 },
	compose(config) {
		return {
			photoprism: {
				image: 'photoprism/photoprism:latest',
				container_name: 'photoprism',
				environment: [
					'PHOTOPRISM_ADMIN_USER=admin',
					'PHOTOPRISM_ADMIN_PASSWORD=${PHOTOPRISM_ADMIN_PASSWORD}',
					'PHOTOPRISM_ORIGINALS_LIMIT=5000',
					'PHOTOPRISM_HTTP_COMPRESSION=gzip',
					'PHOTOPRISM_DATABASE_DRIVER=sqlite',
					'PHOTOPRISM_SITE_URL=http://localhost:2342/',
					'PHOTOPRISM_SITE_TITLE=PhotoPrism'
				],
				volumes: [
					'${PHOTO_DIR}:/photoprism/originals',
					'${CONFIG_DIR}/photoprism/storage:/photoprism/storage'
				],
				ports: ['2342:2342'],
				restart: 'unless-stopped'
			}
		};
	}
};
