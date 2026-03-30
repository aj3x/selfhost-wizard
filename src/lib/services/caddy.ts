import type { ServiceModule } from '$lib/types/configurator';

export const caddy: ServiceModule = {
	id: 'caddy',
	name: 'Caddy',
	description: 'Simple reverse proxy with automatic HTTPS. Human-readable config.',
	category: 'networking',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: ['nginx-proxy-manager'],
	conflictReason: 'Caddy uses config files and auto-HTTPS. Best for users comfortable with text configs. NPM has a web GUI.',
	networks: ['proxy'],
	ports: [
		{ host: 80, container: 80 },
		{ host: 443, container: 443 }
	],
	environment: [],
	resourceEstimate: { ramMB: 64, cpuShares: 64, storageGB: 0.1 },
	compose() {
		return {
			caddy: {
				image: 'caddy:latest',
				container_name: 'caddy',
				ports: ['80:80', '443:443'],
				volumes: [
					'${CONFIG_DIR}/caddy/Caddyfile:/etc/caddy/Caddyfile',
					'${CONFIG_DIR}/caddy/data:/data',
					'${CONFIG_DIR}/caddy/config:/config'
				],
				restart: 'unless-stopped',
				networks: ['proxy']
			}
		};
	}
};
