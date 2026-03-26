import type { ServiceModule } from '$lib/types/configurator';

export const nextcloud: ServiceModule = {
	id: 'nextcloud',
	name: 'Nextcloud',
	description: 'Full Dropbox/Google Drive replacement with file sync, calendar, contacts, and more.',
	category: 'files-sync',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['nextcloud'],
	ports: [{ host: 8443, container: 443 }],
	environment: [
		{ key: 'NC_DB_PASSWORD', description: 'Nextcloud database password', required: true, secret: true }
	],
	resourceEstimate: { ramMB: 512, cpuShares: 512, storageGB: 2 },
	multiContainer: true,
	compose() {
		return {
			nextcloud: {
				image: 'nextcloud:latest',
				container_name: 'nextcloud',
				environment: [
					'POSTGRES_HOST=nextcloud-db',
					'POSTGRES_DB=${NC_DB_NAME:-nextcloud}',
					'POSTGRES_USER=${NC_DB_USER:-nextcloud}',
					'POSTGRES_PASSWORD=${NC_DB_PASSWORD}'
				],
				volumes: [
					'${CONFIG_DIR}/nextcloud:/var/www/html',
					'${FILES_DIR}:/var/www/html/data'
				],
				ports: ['8443:443'],
				depends_on: ['nextcloud-db'],
				restart: 'unless-stopped',
				networks: ['nextcloud']
			},
			'nextcloud-db': {
				image: 'postgres:15-alpine',
				container_name: 'nextcloud-db',
				environment: [
					'POSTGRES_DB=${NC_DB_NAME:-nextcloud}',
					'POSTGRES_USER=${NC_DB_USER:-nextcloud}',
					'POSTGRES_PASSWORD=${NC_DB_PASSWORD}'
				],
				volumes: ['${CONFIG_DIR}/nextcloud-db:/var/lib/postgresql/data'],
				restart: 'unless-stopped',
				networks: ['nextcloud']
			}
		};
	}
};
