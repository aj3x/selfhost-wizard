import type { ServiceModule } from '$lib/types/configurator';

export const portainer: ServiceModule = {
	id: 'portainer',
	name: 'Portainer',
	description: 'GUI for managing Docker containers. See what\'s running, restart services, view logs.',
	category: 'monitoring',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [{ host: 9000, container: 9000 }],
	environment: [],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			portainer: {
				image: 'portainer/portainer-ce:latest',
				container_name: 'portainer',
				volumes: [
					'/var/run/docker.sock:/var/run/docker.sock',
					'${CONFIG_DIR}/portainer:/data'
				],
				ports: ['9000:9000'],
				restart: 'unless-stopped'
			}
		};
	}
};
