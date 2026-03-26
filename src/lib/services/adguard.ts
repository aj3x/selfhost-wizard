import type { ServiceModule } from '$lib/types/configurator';

export const adguard: ServiceModule = {
	id: 'adguard',
	name: 'AdGuard Home',
	description: 'Network-wide ad blocking with encrypted DNS support.',
	category: 'dns-adblock',
	skillLevel: 'beginner',
	requires: [],
	recommends: [],
	conflicts: [],
	networks: [],
	ports: [
		{ host: 53, container: 53 },
		{ host: 3080, container: 3000 },
		{ host: 8053, container: 80 }
	],
	environment: [],
	resourceEstimate: { ramMB: 128, cpuShares: 128, storageGB: 0.5 },
	compose() {
		return {
			adguard: {
				image: 'adguard/adguardhome:latest',
				container_name: 'adguard',
				ports: [
					'53:53/tcp',
					'53:53/udp',
					'3080:3000',
					'8053:80'
				],
				volumes: [
					'${CONFIG_DIR}/adguard/work:/opt/adguardhome/work',
					'${CONFIG_DIR}/adguard/conf:/opt/adguardhome/conf'
				],
				restart: 'unless-stopped'
			}
		};
	}
};
