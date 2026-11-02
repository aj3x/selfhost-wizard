import type { AssessmentState } from '$lib/types/assessment';
import type { ConfiguratorState, GlobalConfig, VpnProvider } from '$lib/types/configurator';
import { DEFAULT_CONFIGURATOR_STATE, DEFAULT_GLOBAL_CONFIG } from '$lib/types/configurator';

/**
 * Map assessment answers to a pre-configured configurator state.
 * This bridges Phase 1 (assessment) to Phase 2 (configurator).
 */
export function mapAssessmentToConfigurator(assessment: AssessmentState): ConfiguratorState {
	const services: string[] = [];

	// Media stack
	if (assessment.wantsMedia) {
		services.push('jellyfin'); // default media server (free, no account needed)

		// Manual libraries don't need the download stack
		if (assessment.automationLevel !== 'manual') {
			services.push('sonarr', 'radarr', 'prowlarr');
			services.push('seerr'); // media requests
			services.push('qbittorrent');
			services.push('gluetun'); // VPN for downloads

			if (assessment.videoQuality === '4k' || assessment.videoQuality === '4k_hdr') {
				services.push('bazarr'); // subtitles more important at 4K
			}

			if (assessment.wantsMusic) {
				services.push('lidarr');
			}

			if (assessment.skillLevel !== 'beginner') {
				services.push('recyclarr');
			}
		}

		if (assessment.needsTranscoding) {
			services.push('tdarr');
		}
	}

	// Photos
	if (assessment.photoBackupIntent === 'replace' || assessment.photoBackupIntent === 'additional') {
		services.push('immich');
	}

	// Files & sync
	if (assessment.wantsFileSync) {
		if (assessment.computers.length > 0 || assessment.worksOffServer === 'heavy') {
			services.push('nextcloud');
		} else {
			services.push('syncthing'); // lighter option
		}
	}

	// Backup
	if (assessment.wantsOffsiteBackup === 'cloud' || assessment.dataCriticality === 'critical' || assessment.dataCriticality === 'mission_critical') {
		services.push('kopia');
	}

	// Network
	if (assessment.remoteAccess === 'regular' || assessment.remoteAccess === 'share') {
		if (assessment.comfortableWithPorts && assessment.wantsDomain) {
			services.push('caddy');
		}
		services.push('tailscale'); // always add for easy remote access
	} else if (assessment.remoteAccess === 'occasional') {
		services.push('tailscale');
	}

	if (assessment.wantsAdBlocking) {
		services.push('adguard');
	}

	// Security
	if (assessment.riskTolerance === 'advanced' || assessment.skillLevel === 'advanced') {
		if (services.includes('caddy')) {
			services.push('authelia');
		}
	}

	// Password manager (if they're paying for one)
	const hasPasswordManager = assessment.otherServices.some(
		(s) => s.category === 'password_manager'
	);
	if (hasPasswordManager) {
		services.push('vaultwarden');
	}

	// Monitoring (always useful)
	services.push('homepage');
	if (assessment.skillLevel === 'advanced') {
		services.push('portainer');
	}
	if (assessment.skillLevel !== 'beginner') {
		services.push('diun');
	}

	// Deduplicate
	const uniqueServices = [...new Set(services)];

	// Map VPN provider if they have one
	let vpnProvider: VpnProvider | null = null;
	if (assessment.vpnService?.enabled && services.includes('gluetun')) {
		const vpnMap: Record<string, VpnProvider> = {
			mullvad: 'mullvad',
			nordvpn: 'nordvpn',
			surfshark: 'surfshark',
			protonvpn: 'protonvpn',
			ipvanish: 'ipvanish'
		};
		vpnProvider = vpnMap[assessment.vpnService.id] || null;
	}

	const globalConfig: GlobalConfig = {
		...DEFAULT_GLOBAL_CONFIG,
		vpnProvider,
		vpnType: vpnProvider === 'mullvad' || vpnProvider === 'surfshark' ? 'wireguard' : 'openvpn'
	};

	return {
		...DEFAULT_CONFIGURATOR_STATE,
		selectedServices: uniqueServices,
		globalConfig,
		fromAssessment: true
	};
}
