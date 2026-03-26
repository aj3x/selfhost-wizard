import type { ServiceModule } from '$lib/types/configurator';

export const kopia: ServiceModule = {
	id: 'kopia',
	name: 'Kopia',
	description: 'Fast, encrypted backups with deduplication and compression.',
	category: 'backup',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['files'],
	ports: [{ host: 51515, container: 51515 }],
	environment: [
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 1 },
	compose() {
		return {
			kopia: {
				image: 'kopia/kopia:latest',
				container_name: 'kopia',
				environment: ['TZ=${TZ}'],
				volumes: [
					'${CONFIG_DIR}/kopia:/app/config',
					'${BACKUP_DIR}:/backups',
					'${CONFIG_DIR}:/sources/config:ro',
					'${MEDIA_DIR}:/sources/media:ro'
				],
				ports: ['51515:51515'],
				restart: 'unless-stopped',
				networks: ['files']
			}
		};
	}
};
