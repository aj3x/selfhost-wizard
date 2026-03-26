import type { ServiceModule } from '$lib/types/configurator';

export const homepage: ServiceModule = {
	id: 'homepage',
	name: 'Homepage',
	description: 'Beautiful dashboard showing all your services with status and quick links.',
	category: 'monitoring',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [{ host: 3000, container: 3000 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.1 },
	compose() {
		return {
			homepage: {
				image: 'ghcr.io/gethomepage/homepage:latest',
				container_name: 'homepage',
				environment: ['PUID=${PUID}', 'PGID=${PGID}'],
				volumes: [
					'${CONFIG_DIR}/homepage:/app/config',
					'/var/run/docker.sock:/var/run/docker.sock:ro'
				],
				ports: ['3000:3000'],
				restart: 'unless-stopped'
			}
		};
	}
};
