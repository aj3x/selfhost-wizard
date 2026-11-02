// ── Streaming Bandwidth Constants ──
/** Minimum upload Mbps per 1080p stream (H.264 direct play) */
export const STREAM_1080P_MBPS = 10;
/** Minimum upload Mbps per 4K stream (direct play, no transcode) */
export const STREAM_4K_MBPS = 20;
import type { SkillLevel } from './assessment';

// ── Service Categories ──

export type ServiceCategory =
	| 'media-server'
	| 'media-management'
	| 'download-client'
	| 'media-processing'
	| 'photos'
	| 'files-sync'
	| 'backup'
	| 'networking'
	| 'dns-adblock'
	| 'authentication'
	| 'home-automation'
	| 'productivity'
	| 'monitoring';

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
	'media-server': 'Media Server',
	'media-management': 'Media Management',
	'download-client': 'Download Clients',
	'media-processing': 'Media Processing',
	photos: 'Photos',
	'files-sync': 'Files & Sync',
	backup: 'Backup',
	networking: 'Networking',
	'dns-adblock': 'DNS & Ad Blocking',
	authentication: 'Authentication',
	'home-automation': 'Home Automation',
	productivity: 'Productivity',
	monitoring: 'Monitoring'
};

// Order for UI rendering
export const SERVICE_CATEGORY_ORDER: ServiceCategory[] = [
	'media-server',
	'media-management',
	'download-client',
	'media-processing',
	'photos',
	'files-sync',
	'backup',
	'networking',
	'dns-adblock',
	'authentication',
	'home-automation',
	'productivity',
	'monitoring'
];

// ── Docker Primitives ──

export type DockerNetwork = 'proxy' | 'media' | 'vpn' | 'immich' | 'files' | 'nextcloud';

export interface VolumeMount {
	/** Host path using env vars, e.g. "${CONFIG_DIR}/sonarr:/config" */
	hostPath: string;
	containerPath: string;
	readOnly?: boolean;
}

export interface PortMapping {
	host: number;
	container: number;
	protocol?: 'tcp' | 'udp';
}

export interface EnvVar {
	key: string;
	/** Static value, or undefined if user-provided */
	value?: string;
	/** Description shown in config UI */
	description?: string;
	/** If true, auto-generate a secure random value */
	secret?: boolean;
	/** If true, this var is required before generation */
	required?: boolean;
}

export interface ResourceEstimate {
	ramMB: number;
	cpuShares: number;
	storageGB: number;
}

// ── Dependency Rules ──

export interface DependencyAll {
	type: 'all';
	serviceIds: string[];
}

export interface DependencyOneOf {
	type: 'one_of';
	serviceIds: string[];
	/** Explanation shown in UI, e.g. "a download client" */
	label: string;
	/** Which option to auto-select if none chosen */
	defaultId?: string;
}

export type DependencyRule = DependencyAll | DependencyOneOf;

// ── Compose Fragment ──

export interface ComposeService {
	image: string;
	container_name: string;
	user?: string;
	environment?: string[];
	volumes?: string[];
	ports?: string[];
	networks?: string[];
	restart?: string;
	depends_on?: Record<string, { condition: string }> | string[];
	network_mode?: string;
	cap_add?: string[];
	devices?: string[];
	hostname?: string;
	extra_hosts?: string[];
	healthcheck?: {
		test: string[];
		interval: string;
		timeout: string;
		retries: number;
		start_period?: string;
	};
}

// ── Service Module ──

export interface ServiceModule {
	id: string;
	name: string;
	description: string;
	category: ServiceCategory;
	skillLevel: SkillLevel;
	requires: DependencyRule[];
	recommends: string[];
	conflicts: string[];
	networks: DockerNetwork[];
	/** Primary ports exposed by this service */
	ports: PortMapping[];
	/** Environment variables for this service */
	environment: EnvVar[];
	/** Resource estimates for hardware sizing */
	resourceEstimate: ResourceEstimate;
	/** Whether this service should route through Gluetun VPN */
	vpnRouted?: boolean;
	/** Whether this is a multi-container service (e.g. Immich, Nextcloud) */
	multiContainer?: boolean;
	/** Brief explanation shown when this service conflicts with another */
	conflictReason?: string;
	/** Compose function — returns one or more service definitions based on config */
	compose: (config: ServiceConfig) => Record<string, ComposeService>;
}

// ── Service Configuration ──

export interface ServiceConfig {
	puid: number;
	pgid: number;
	tz: string;
	baseDir: string;
	mediaDir: string;
	configDir: string;
	photoDir: string;
	filesDir: string;
	backupDir: string;
	/** Per-service user-provided env vars */
	env: Record<string, string>;
	/** Feature flags from assessment or user input */
	features: {
		music: boolean;
		gpuTranscoding: boolean;
		vpnEnabled: boolean;
	};
}

// ── VPN Configuration ──

export type VpnProvider = 'mullvad' | 'surfshark' | 'protonvpn' | 'nordvpn' | 'ipvanish' | 'custom';

export type VpnType = 'wireguard' | 'openvpn';

export interface VpnProviderInfo {
	id: VpnProvider;
	name: string;
	description: string;
	recommended?: boolean;
	monthlyCost: string;
	defaultType: VpnType;
	supportsPortForwarding: boolean;
	envVars: EnvVar[];
}

export const VPN_PROVIDERS: VpnProviderInfo[] = [
	{
		id: 'mullvad',
		name: 'Mullvad',
		description: 'No email, no logging, anonymous payment.',
		recommended: true,
		monthlyCost: '$5.46',
		defaultType: 'wireguard',
		supportsPortForwarding: false,
		envVars: [
			{ key: 'WIREGUARD_PRIVATE_KEY', description: 'Mullvad WireGuard private key', required: true, secret: true },
			{ key: 'WIREGUARD_ADDRESSES', description: 'Mullvad address (e.g. 10.66.x.x/32)', required: true }
		]
	},
	{
		id: 'surfshark',
		name: 'Surfshark',
		description: 'Budget-friendly with good performance.',
		monthlyCost: 'from $2.49',
		defaultType: 'wireguard',
		supportsPortForwarding: false,
		envVars: [
			{ key: 'WIREGUARD_PRIVATE_KEY', description: 'Surfshark WireGuard private key', required: true, secret: true },
			{ key: 'WIREGUARD_ADDRESSES', description: 'Surfshark WireGuard address', required: true }
		]
	},
	{
		id: 'protonvpn',
		name: 'ProtonVPN',
		description: 'Swiss privacy. Requires paid plan for P2P.',
		monthlyCost: 'from $4.99',
		defaultType: 'openvpn',
		supportsPortForwarding: true,
		envVars: [
			{ key: 'OPENVPN_USER', description: 'ProtonVPN OpenVPN username', required: true },
			{ key: 'OPENVPN_PASSWORD', description: 'ProtonVPN OpenVPN password', required: true, secret: true }
		]
	},
	{
		id: 'nordvpn',
		name: 'NordVPN',
		description: 'Large server network. OpenVPN recommended for reliability.',
		monthlyCost: 'from $3.69',
		defaultType: 'openvpn',
		supportsPortForwarding: false,
		envVars: [
			{ key: 'OPENVPN_USER', description: 'NordVPN service username', required: true },
			{ key: 'OPENVPN_PASSWORD', description: 'NordVPN service password', required: true, secret: true }
		]
	},
	{
		id: 'ipvanish',
		name: 'IPVanish',
		description: 'Simple setup, unlimited devices.',
		monthlyCost: 'from $3.33',
		defaultType: 'openvpn',
		supportsPortForwarding: false,
		envVars: [
			{ key: 'OPENVPN_USER', description: 'IPVanish username', required: true },
			{ key: 'OPENVPN_PASSWORD', description: 'IPVanish password', required: true, secret: true }
		]
	},
	{
		id: 'custom',
		name: 'Other / Custom',
		description: 'Use any OpenVPN or WireGuard provider.',
		monthlyCost: 'varies',
		defaultType: 'openvpn',
		supportsPortForwarding: false,
		envVars: [
			{ key: 'OPENVPN_USER', description: 'OpenVPN username', required: true },
			{ key: 'OPENVPN_PASSWORD', description: 'OpenVPN password', required: true, secret: true },
			{ key: 'WIREGUARD_PRIVATE_KEY', description: 'WireGuard private key', required: true, secret: true },
			{ key: 'WIREGUARD_ADDRESSES', description: 'WireGuard address', required: true }
		]
	}
];

// ── Global Config ──

export interface GlobalConfig {
	puid: number;
	pgid: number;
	tz: string;
	baseDir: string;
	mediaDir: string;
	configDir: string;
	photoDir: string;
	filesDir: string;
	backupDir: string;
	/** Container-internal path for movies (used by Sonarr/Radarr root folder setup) */
	moviesPath: string;
	/** Container-internal path for TV shows (used by Sonarr/Radarr root folder setup) */
	tvPath: string;
	hostname: string;
	/** Reverse proxy domain (optional) */
	domain: string;
	/** Let's Encrypt email (required if domain set) */
	email: string;
	/** VPN provider (if Gluetun selected) */
	vpnProvider: VpnProvider | null;
	vpnType: VpnType;
	vpnCountry: string;
	/** Per-provider VPN credentials */
	vpnEnv: Record<string, string>;
}

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
	puid: 1000,
	pgid: 1000,
	tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
	baseDir: '/opt/docker',
	mediaDir: '${BASE_DIR}/media',
	configDir: '${BASE_DIR}/config',
	photoDir: '${BASE_DIR}/photos',
	filesDir: '${BASE_DIR}/files',
	backupDir: '${BASE_DIR}/backups',
	moviesPath: '/media/movies',
	tvPath: '/media/tv',
	hostname: 'homeserver',
	domain: '',
	email: '',
	vpnProvider: null,
	vpnType: 'wireguard',
	vpnCountry: '',
	vpnEnv: {}
};

/** Secrets generated automatically for each service and written to .env */
export const GENERATED_SECRETS: Record<string, string[]> = {
	immich: ['IMMICH_DB_PASSWORD'],
	nextcloud: ['NC_DB_PASSWORD'],
	paperless: ['PAPERLESS_DB_PASSWORD'],
	photoprism: ['PHOTOPRISM_ADMIN_PASSWORD']
};

// ── Presets ──

export interface Preset {
	id: string;
	name: string;
	description: string;
	skillLevel: SkillLevel;
	serviceIds: string[];
}

export const PRESETS: Preset[] = [
	{
		id: 'media-starter',
		name: 'Media Server Starter',
		description: 'Stream your own movies and TV shows with automated downloads.',
		skillLevel: 'beginner',
		serviceIds: [
			'jellyfin', 'sonarr', 'radarr', 'prowlarr', 'seerr',
			'qbittorrent', 'gluetun', 'homepage'
		]
	},
	{
		id: 'full-media',
		name: 'Full Media Stack',
		description: 'Complete media management with subtitles, requests, transcoding, and monitoring.',
		skillLevel: 'intermediate',
		serviceIds: [
			'jellyfin', 'sonarr', 'radarr', 'prowlarr', 'bazarr',
			'qbittorrent', 'gluetun', 'seerr', 'tdarr', 'recyclarr',
			'homepage'
		]
	},
	{
		id: 'photo-files',
		name: 'Photo & Files',
		description: 'Back up photos and sync files across devices.',
		skillLevel: 'beginner',
		serviceIds: ['immich', 'syncthing', 'homepage']
	},
	{
		id: 'everything',
		name: 'Everything',
		description: 'Full media stack plus photos, files, backup, security, and more.',
		skillLevel: 'advanced',
		serviceIds: [
			'jellyfin', 'sonarr', 'radarr', 'prowlarr', 'bazarr',
			'qbittorrent', 'gluetun', 'seerr', 'tdarr', 'recyclarr',
			'immich', 'nextcloud', 'kopia', 'adguard',
			'authelia', 'caddy', 'uptime-kuma', 'portainer',
			'vaultwarden', 'paperless', 'diun', 'homepage'
		]
	}
];

// ── Configurator State ──

export interface ConfiguratorState {
	/** Service IDs the user has selected */
	selectedServices: string[];
	/** Service IDs added automatically by dependency resolution */
	resolvedDependencies: string[];
	/** User choices for one_of dependencies: dependentServiceId -> chosenServiceId */
	dependencyChoices: Record<string, string>;
	/** Per-service environment variable overrides */
	serviceEnv: Record<string, Record<string, string>>;
	/** Global configuration */
	globalConfig: GlobalConfig;
	/** Which preset was applied (if any) */
	activePreset: string | null;
	/** Whether the user came from assessment */
	fromAssessment: boolean;
	/** Cached generated passwords (so they don't change on every render) */
	generatedSecrets: Record<string, string>;
}

export const DEFAULT_CONFIGURATOR_STATE: ConfiguratorState = {
	selectedServices: [],
	resolvedDependencies: [],
	dependencyChoices: {},
	serviceEnv: {},
	globalConfig: { ...DEFAULT_GLOBAL_CONFIG },
	activePreset: null,
	fromAssessment: false,
	generatedSecrets: {}
};

// ── Generated Output ──

export interface GeneratedOutput {
	composeYaml: string;
	envFile: string;
	setupScript: string;
	caddyfile: string | null;
	readme: string;
}

// ── Validation ──

export interface ValidationError {
	type: 'dependency' | 'conflict' | 'port' | 'config';
	message: string;
	serviceIds: string[];
}

export interface PortConflict {
	port: number;
	protocol: 'tcp' | 'udp';
	services: string[];
}
