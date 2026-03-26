import type { ServiceModule } from '$lib/types/configurator';

export const paperless: ServiceModule = {
	id: 'paperless',
	name: 'Paperless-ngx',
	description: 'Document management with OCR. Scan and organize receipts, bills, and letters.',
	category: 'productivity',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [{ host: 8000, container: 8000 }],
	environment: [
		{ key: 'PAPERLESS_DB_PASSWORD', description: 'Paperless database password', required: true, secret: true }
	],
	resourceEstimate: { ramMB: 512, cpuShares: 512, storageGB: 2 },
	multiContainer: true,
	compose(config) {
		return {
			paperless: {
				image: 'ghcr.io/paperless-ngx/paperless-ngx:latest',
				container_name: 'paperless',
				environment: [
					'PAPERLESS_REDIS=redis://paperless-redis:6379',
					'PAPERLESS_DBHOST=paperless-db',
					'PAPERLESS_OCR_LANGUAGE=eng',
					`USERMAP_UID=\${PUID}`,
					`USERMAP_GID=\${PGID}`
				],
				volumes: [
					'${CONFIG_DIR}/paperless/data:/usr/src/paperless/data',
					'${CONFIG_DIR}/paperless/media:/usr/src/paperless/media',
					'${FILES_DIR}/paperless/consume:/usr/src/paperless/consume'
				],
				ports: ['8000:8000'],
				depends_on: ['paperless-db', 'paperless-redis'],
				restart: 'unless-stopped'
			},
			'paperless-db': {
				image: 'postgres:15',
				container_name: 'paperless-db',
				environment: [
					'POSTGRES_DB=paperless',
					'POSTGRES_USER=paperless',
					'POSTGRES_PASSWORD=${PAPERLESS_DB_PASSWORD}'
				],
				volumes: ['${CONFIG_DIR}/paperless/pgdata:/var/lib/postgresql/data'],
				restart: 'unless-stopped'
			},
			'paperless-redis': {
				image: 'redis:7',
				container_name: 'paperless-redis',
				restart: 'unless-stopped'
			}
		};
	}
};
