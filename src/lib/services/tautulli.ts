import type { ServiceModule } from '$lib/types/configurator';

export const tautulli: ServiceModule = {
	id: 'tautulli',
	name: 'Tautulli',
	description: 'Monitoring and analytics for Plex — see who\'s watching what.',
	category: 'media-management',
	skillLevel: 'beginner',
	requires: [{ type: 'all', serviceIds: ['plex'] }],
	recommends: [],
	conflicts: [],
	networks: ['media'],
	ports: [{ host: 8181, container: 8181 }],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			tautulli: {
				image: 'lscr.io/linuxserver/tautulli:latest',
				container_name: 'tautulli',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: ['${CONFIG_DIR}/tautulli:/config'],
				ports: ['8181:8181'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
