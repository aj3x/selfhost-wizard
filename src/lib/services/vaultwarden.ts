import type { ServiceModule } from '$lib/types/configurator';

export const vaultwarden: ServiceModule = {
	id: 'vaultwarden',
	name: 'Vaultwarden',
	description: 'Self-hosted password manager. Compatible with official Bitwarden clients.',
	category: 'productivity',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [{ host: 8222, container: 80 }],
	environment: [
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 64, cpuShares: 64, storageGB: 0.5 },
	compose() {
		return {
			vaultwarden: {
				image: 'vaultwarden/server:latest',
				container_name: 'vaultwarden',
				environment: ['TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/vaultwarden:/data'],
				ports: ['8222:80'],
				restart: 'unless-stopped'
			}
		};
	}
};
