import type { ServiceModule } from '$lib/types/configurator';

export const filebrowser: ServiceModule = {
	id: 'filebrowser',
	name: 'Filebrowser',
	description: 'Simple web-based file manager for browsing and sharing files.',
	category: 'files-sync',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['files'],
	ports: [{ host: 8082, container: 80 }],
	environment: [],
	resourceEstimate: { ramMB: 64, cpuShares: 64, storageGB: 0.1 },
	compose() {
		return {
			filebrowser: {
				image: 'filebrowser/filebrowser:latest',
				container_name: 'filebrowser',
				volumes: [
					'${FILES_DIR}:/srv',
					'${CONFIG_DIR}/filebrowser/database.db:/database.db',
					'${CONFIG_DIR}/filebrowser/.filebrowser.json:/.filebrowser.json'
				],
				ports: ['8082:80'],
				restart: 'unless-stopped',
				networks: ['files']
			}
		};
	}
};
