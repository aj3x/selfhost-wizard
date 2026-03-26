import type { ServiceModule } from '$lib/types/configurator';

export const uptimeKuma: ServiceModule = {
	id: 'uptime-kuma',
	name: 'Uptime Kuma',
	description: 'Monitor if your services are up. Get notifications when something goes down.',
	category: 'monitoring',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [{ host: 3001, container: 3001 }],
	environment: [],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			'uptime-kuma': {
				image: 'louislam/uptime-kuma:latest',
				container_name: 'uptime-kuma',
				volumes: ['${CONFIG_DIR}/uptime-kuma:/app/data'],
				ports: ['3001:3001'],
				restart: 'unless-stopped'
			}
		};
	}
};
