import type { ServiceModule } from '$lib/types/configurator';

export const syncthing: ServiceModule = {
	id: 'syncthing',
	name: 'Syncthing',
	description: 'Peer-to-peer file sync. Lighter and simpler than Nextcloud.',
	category: 'files-sync',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['files'],
	ports: [
		{ host: 8384, container: 8384 },
		{ host: 22000, container: 22000 },
		{ host: 21027, container: 21027, protocol: 'udp' }
	],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 128, cpuShares: 256, storageGB: 0.5 },
	compose() {
		return {
			syncthing: {
				image: 'lscr.io/linuxserver/syncthing:latest',
				container_name: 'syncthing',
				environment: ['PUID=${PUID}', 'PGID=${PGID}', 'TZ=${TZ}'],
				volumes: [
					'${CONFIG_DIR}/syncthing:/config',
					'${FILES_DIR}/sync:/sync'
				],
				ports: [
					'8384:8384',
					'22000:22000/tcp',
					'22000:22000/udp',
					'21027:21027/udp'
				],
				restart: 'unless-stopped',
				networks: ['files']
			}
		};
	}
};
