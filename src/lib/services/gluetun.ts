import type { ServiceModule, ComposeService } from '$lib/types/configurator';

export const gluetun: ServiceModule = {
	id: 'gluetun',
	name: 'Gluetun',
	description: 'VPN container that routes download client traffic through a secure tunnel.',
	category: 'networking',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['vpn', 'media'],
	ports: [],
	environment: [
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.1 },
	compose(config) {
		const environment = [
			`VPN_SERVICE_PROVIDER=\${VPN_PROVIDER}`,
			'TZ=${TZ}'
		];

		const vpnType = config.env.VPN_TYPE || 'wireguard';
		environment.push(`VPN_TYPE=${vpnType}`);

		// Add provider-specific env vars from user config
		const skipKeys = new Set(['VPN_PROVIDER', 'VPN_SERVICE_PROVIDER', 'VPN_TYPE', 'VPN_COUNTRY', 'HOSTNAME']);
		for (const [key, val] of Object.entries(config.env)) {
			if (!skipKeys.has(key) && val) {
				environment.push(`${key}=\${${key}}`);
			}
		}

		if (config.env.VPN_COUNTRY) {
			environment.push('SERVER_COUNTRIES=${VPN_COUNTRY}');
		}

		const ports: string[] = [];
		// Ports for VPN-routed services are added dynamically by the compose engine

		const svc: ComposeService = {
			image: 'qmcgaw/gluetun:latest',
			container_name: 'gluetun',
			cap_add: ['NET_ADMIN'],
			devices: ['/dev/net/tun:/dev/net/tun'],
			environment,
			volumes: ['${CONFIG_DIR}/gluetun:/gluetun'],
			ports,
			restart: 'unless-stopped',
			// Joins media so *arr services can reach VPN-routed download clients
			networks: ['vpn', 'media'],
			healthcheck: {
				test: ['CMD', '/gluetun-entrypoint', 'healthcheck'],
				interval: '30s',
				timeout: '10s',
				retries: 5,
				start_period: '30s'
			}
		};

		return { gluetun: svc };
	}
};
