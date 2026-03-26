import type { ServiceModule } from '$lib/types/configurator';

export const homeAssistant: ServiceModule = {
	id: 'home-assistant',
	name: 'Home Assistant',
	description: 'Open-source home automation platform.',
	category: 'home-automation',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [{ host: 8123, container: 8123 }],
	environment: [
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 512, cpuShares: 512, storageGB: 1 },
	compose() {
		return {
			'home-assistant': {
				image: 'ghcr.io/home-assistant/home-assistant:stable',
				container_name: 'home-assistant',
				environment: ['TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/homeassistant:/config'],
				restart: 'unless-stopped',
				network_mode: 'host'
			}
		};
	}
};
