import type { ServiceModule } from '$lib/types/configurator';

export const duplicati: ServiceModule = {
	id: 'duplicati',
	name: 'Duplicati',
	description: 'Backup to cloud storage (B2, S3, Google Drive) with encryption.',
	category: 'backup',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['files'],
	ports: [{ host: 8200, container: 8200 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 1 },
	compose() {
		return {
			duplicati: {
				image: 'lscr.io/linuxserver/duplicati:latest',
				container_name: 'duplicati',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: [
					'${CONFIG_DIR}/duplicati:/config',
					'${BACKUP_DIR}:/backups',
					'${CONFIG_DIR}:/source/config:ro',
					'${MEDIA_DIR}:/source/media:ro'
				],
				ports: ['8200:8200'],
				restart: 'unless-stopped',
				networks: ['files']
			}
		};
	}
};
