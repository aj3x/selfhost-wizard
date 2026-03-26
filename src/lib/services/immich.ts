import type { ServiceModule } from '$lib/types/configurator';

export const immich: ServiceModule = {
	id: 'immich',
	name: 'Immich',
	description: 'Self-hosted Google Photos replacement with face recognition and smart search.',
	category: 'photos',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['immich'],
	ports: [{ host: 2283, container: 2283 }],
	environment: [
		{ key: 'IMMICH_DB_PASSWORD', description: 'Immich database password', required: true, secret: true }
	],
	resourceEstimate: { ramMB: 2048, cpuShares: 1024, storageGB: 5 },
	multiContainer: true,
	compose(config) {
		const dbPassword = config.env.IMMICH_DB_PASSWORD || 'changeme';

		return {
			'immich-server': {
				image: 'ghcr.io/immich-app/immich-server:release',
				container_name: 'immich-server',
				environment: [
					'DB_HOSTNAME=immich-postgres',
					'DB_USERNAME=${IMMICH_DB_USER:-postgres}',
					'DB_PASSWORD=${IMMICH_DB_PASSWORD}',
					'DB_DATABASE_NAME=${IMMICH_DB_NAME:-immich}',
					'REDIS_HOSTNAME=immich-redis',
					'UPLOAD_LOCATION=/usr/src/app/upload',
					'IMMICH_MACHINE_LEARNING_URL=http://immich-machine-learning:3003'
				],
				volumes: ['${PHOTO_DIR}:/usr/src/app/upload'],
				ports: ['2283:2283'],
				depends_on: ['immich-redis', 'immich-postgres'],
				restart: 'unless-stopped',
				networks: ['immich']
			},
			'immich-machine-learning': {
				image: 'ghcr.io/immich-app/immich-machine-learning:release',
				container_name: 'immich-machine-learning',
				volumes: ['${CONFIG_DIR}/immich/ml-cache:/cache'],
				restart: 'unless-stopped',
				networks: ['immich']
			},
			'immich-redis': {
				image: 'redis:6.2-alpine',
				container_name: 'immich-redis',
				restart: 'unless-stopped',
				networks: ['immich']
			},
			'immich-postgres': {
				image: 'tensorchord/pgvecto-rs:pg14-v0.2.0',
				container_name: 'immich-postgres',
				environment: [
					'POSTGRES_PASSWORD=${IMMICH_DB_PASSWORD}',
					'POSTGRES_USER=${IMMICH_DB_USER:-postgres}',
					'POSTGRES_DB=${IMMICH_DB_NAME:-immich}'
				],
				volumes: ['${CONFIG_DIR}/immich/postgres:/var/lib/postgresql/data'],
				restart: 'unless-stopped',
				networks: ['immich']
			}
		};
	}
};
