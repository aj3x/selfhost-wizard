import type { ServiceModule } from '$lib/types/configurator';

export const recyclarr: ServiceModule = {
	id: 'recyclarr',
	name: 'Recyclarr',
	description:
		'Automatically syncs TRaSH Guides quality profiles and custom formats to Sonarr and Radarr.',
	category: 'media-management',
	skillLevel: 'intermediate',
	requires: [
		{
			type: 'one_of',
			serviceIds: ['sonarr', 'radarr'],
			label: 'Sonarr or Radarr',
			defaultId: 'sonarr'
		}
	],
	recommends: ['sonarr', 'radarr'],
	conflicts: [],
	networks: ['media'],
	ports: [],
	environment: [
		{ key: 'TZ', value: '${TZ}' },
		{ key: 'RECYCLARR_CREATE_CONFIG', value: 'true', description: 'Create default config on first run' }
	],
	resourceEstimate: { ramMB: 64, cpuShares: 64, storageGB: 0.1 },
	compose() {
		return {
			recyclarr: {
				image: 'ghcr.io/recyclarr/recyclarr:latest',
				container_name: 'recyclarr',
				environment: ['TZ=${TZ}', 'RECYCLARR_CREATE_CONFIG=true'],
				volumes: ['${CONFIG_DIR}/recyclarr:/config'],
				restart: 'unless-stopped',
				networks: ['media']
			}
		};
	}
};
