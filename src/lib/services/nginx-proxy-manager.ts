import type { ServiceModule } from '$lib/types/configurator';

export const nginxProxyManager: ServiceModule = {
	id: 'nginx-proxy-manager',
	name: 'Nginx Proxy Manager',
	description: 'GUI-based reverse proxy. Easiest option for beginners.',
	category: 'networking',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: ['caddy'],
	networks: ['proxy'],
	ports: [
		{ host: 80, container: 80 },
		{ host: 443, container: 443 },
		{ host: 81, container: 81 }
	],
	environment: [],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			'nginx-proxy-manager': {
				image: 'jc21/nginx-proxy-manager:latest',
				container_name: 'nginx-proxy-manager',
				ports: ['80:80', '443:443', '81:81'],
				volumes: [
					'${CONFIG_DIR}/npm/data:/data',
					'${CONFIG_DIR}/npm/letsencrypt:/etc/letsencrypt'
				],
				restart: 'unless-stopped',
				networks: ['proxy']
			}
		};
	}
};
