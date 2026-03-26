import type { ServiceModule } from '$lib/types/configurator';

export const authelia: ServiceModule = {
	id: 'authelia',
	name: 'Authelia',
	description: 'Single sign-on and 2FA for all your services.',
	category: 'authentication',
	skillLevel: 'intermediate',
	requires: [
		{
			type: 'one_of',
			serviceIds: ['caddy', 'nginx-proxy-manager'],
			label: 'a reverse proxy',
			defaultId: 'caddy'
		}
	],
	recommends: [],
	conflicts: [],
	networks: ['proxy'],
	ports: [{ host: 9091, container: 9091 }],
	environment: [
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			authelia: {
				image: 'authelia/authelia:latest',
				container_name: 'authelia',
				environment: ['TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/authelia:/config'],
				ports: ['9091:9091'],
				restart: 'unless-stopped',
				networks: ['proxy']
			}
		};
	}
};
