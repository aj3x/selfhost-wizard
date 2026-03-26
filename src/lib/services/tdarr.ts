import type { ServiceModule, ComposeService } from '$lib/types/configurator';

export const tdarr: ServiceModule = {
	id: 'tdarr',
	name: 'Tdarr',
	description: 'Pre-transcode your library to save space and reduce real-time transcoding load.',
	category: 'media-processing',
	skillLevel: 'intermediate',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: ['media'],
	ports: [
		{ host: 8265, container: 8265 },
		{ host: 8266, container: 8266 }
	],
	environment: [
		{ key: 'PUID', value: '${PUID}' },
		{ key: 'PGID', value: '${PGID}' },
		{ key: 'TZ', value: '${TZ}' }
	],
	resourceEstimate: { ramMB: 1024, cpuShares: 1024, storageGB: 2 },
	compose(config) {
		const svc: ComposeService = {
			image: 'ghcr.io/haveagitgat/tdarr:latest',
			container_name: 'tdarr',
			environment: [
				'PUID=${PUID}',
				'PGID=${PGID}',
				'TZ=${TZ}',
				'serverIP=0.0.0.0',
				'serverPort=8266',
				'webUIPort=8265',
				'internalNode=true',
				'inContainer=true'
			],
			volumes: [
				'${CONFIG_DIR}/tdarr/server:/app/server',
				'${CONFIG_DIR}/tdarr/configs:/app/configs',
				'${CONFIG_DIR}/tdarr/logs:/app/logs',
				'${MEDIA_DIR}/movies:/movies',
				'${MEDIA_DIR}/tv:/tv',
				'/tmp/tdarr:/temp'
			],
			ports: ['8265:8265', '8266:8266'],
			restart: 'unless-stopped',
			networks: ['media']
		};

		if (config.features.gpuTranscoding) {
			svc.devices = ['/dev/dri:/dev/dri'];
		}

		return { tdarr: svc };
	}
};
