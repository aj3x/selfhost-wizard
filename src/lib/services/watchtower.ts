import type { ServiceModule } from '$lib/types/configurator';

export const watchtower: ServiceModule = {
	id: 'watchtower',
	name: 'Watchtower',
	description: 'Automatically updates Docker containers. Set and forget.',
	category: 'monitoring',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [],
	environment: [
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 64, cpuShares: 64, storageGB: 0.1 },
	compose() {
		return {
			watchtower: {
				image: 'containrrr/watchtower:latest',
				container_name: 'watchtower',
				environment: [
					'TZ=${TZ}',
					'WATCHTOWER_CLEANUP=true',
					'WATCHTOWER_SCHEDULE=0 0 4 * * *'
				],
				volumes: ['/var/run/docker.sock:/var/run/docker.sock'],
				restart: 'unless-stopped'
			}
		};
	}
};
