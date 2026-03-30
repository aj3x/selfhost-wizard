import type { ServiceModule } from '$lib/types/configurator';

export const tailscale: ServiceModule = {
	id: 'tailscale',
	name: 'Tailscale',
	description: 'Easiest remote access. No port forwarding needed. Free for personal use.',
	category: 'networking',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [],
	environment: [
		{ key: 'TS_AUTHKEY', description: 'Tailscale auth key from admin console', required: true, secret: true }
	],
	resourceEstimate: { ramMB: 64, cpuShares: 64, storageGB: 0.1 },
	compose(config) {
		return {
			tailscale: {
				image: 'tailscale/tailscale:latest',
				container_name: 'tailscale',
				hostname: `\${HOSTNAME:-${config.env.HOSTNAME || 'homeserver'}}`,
				environment: [
					'TS_AUTHKEY=${TS_AUTHKEY}',
					'TS_STATE_DIR=/var/lib/tailscale',
					'TS_EXTRA_ARGS=--advertise-exit-node'
				],
				volumes: ['${CONFIG_DIR}/tailscale:/var/lib/tailscale'],
				cap_add: ['NET_ADMIN', 'SYS_MODULE'],
				restart: 'unless-stopped',
				network_mode: 'host'
			}
		};
	}
};
