import type { ServiceModule } from '$lib/types/configurator';

export const mealie: ServiceModule = {
	id: 'mealie',
	name: 'Mealie',
	description: 'Self-hosted recipe manager with meal planning and shopping lists.',
	category: 'productivity',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [{ host: 9925, container: 9000 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 256, cpuShares: 256, storageGB: 0.5 },
	compose() {
		return {
			mealie: {
				image: 'ghcr.io/mealie-recipes/mealie:latest',
				container_name: 'mealie',
				environment: [
					'PUID=${PUID}',
					'PGID=${PGID}',
					'TZ=${TZ}',
					'BASE_URL=http://localhost:9925'
				],
				volumes: ['${CONFIG_DIR}/mealie:/app/data'],
				ports: ['9925:9000'],
				restart: 'unless-stopped'
			}
		};
	}
};
