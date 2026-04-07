import type { ServiceModule } from '$lib/types/configurator';

export const diun: ServiceModule = {
	id: 'diun',
	name: 'Diun',
	description:
		'Monitors your Docker images and notifies you when updates are available. Safer than auto-pulling updates.',
	category: 'monitoring',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [],
	environment: [
		{ key: 'TZ', value: '${TZ}' },
		{ key: 'DIUN_WATCH_SCHEDULE', value: '0 */6 * * *', description: 'How often to check for updates (cron syntax, default every 6 hours)' },
		{ key: 'DIUN_PROVIDERS_DOCKER', value: 'true' },
		{ key: 'DIUN_WATCH_FIRSTCHECKNOTIF', value: 'true', description: 'Notify on first check' }
	],
	resourceEstimate: { ramMB: 64, cpuShares: 64, storageGB: 0.1 },
	compose() {
		return {
			diun: {
				image: 'crazymax/diun:latest',
				container_name: 'diun',
				environment: [
					'TZ=${TZ}',
					'DIUN_WATCH_SCHEDULE=0 */6 * * *',
					'DIUN_PROVIDERS_DOCKER=true',
					'DIUN_WATCH_FIRSTCHECKNOTIF=true'
				],
				volumes: [
					'${CONFIG_DIR}/diun:/data',
					'/var/run/docker.sock:/var/run/docker.sock:ro'
				],
				restart: 'unless-stopped'
			}
		};
	}
};
