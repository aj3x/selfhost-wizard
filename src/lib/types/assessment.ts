// ── Shared primitives ──

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type Currency = 'USD' | 'CAD' | 'EUR' | 'GBP' | 'AUD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
	USD: '$',
	CAD: 'CA$',
	EUR: '€',
	GBP: '£',
	AUD: 'A$'
};

// ── Screen 1: About You ──

export interface LocationConfig {
	label: string;
	defaultElectricityRate: number;
	currency: Currency;
}

export const LOCATIONS: Record<string, LocationConfig> = {
	us_avg: { label: 'US (Average)', defaultElectricityRate: 0.16, currency: 'USD' },
	us_ca: { label: 'US (California)', defaultElectricityRate: 0.27, currency: 'USD' },
	us_tx: { label: 'US (Texas)', defaultElectricityRate: 0.13, currency: 'USD' },
	us_ny: { label: 'US (New York)', defaultElectricityRate: 0.2, currency: 'USD' },
	canada: { label: 'Canada', defaultElectricityRate: 0.13, currency: 'CAD' },
	uk: { label: 'United Kingdom', defaultElectricityRate: 0.28, currency: 'GBP' },
	germany: { label: 'Germany', defaultElectricityRate: 0.35, currency: 'EUR' },
	france: { label: 'France', defaultElectricityRate: 0.21, currency: 'EUR' },
	australia: { label: 'Australia', defaultElectricityRate: 0.3, currency: 'AUD' },
	custom: { label: 'Custom', defaultElectricityRate: 0.16, currency: 'USD' }
};

// ── Screen 2: Hardware ──

export type DriveType = 'hdd' | 'ssd';

export interface ExistingDrive {
	sizeGB: number;
	type: DriveType;
	ageYears: number;
	isNASRated: boolean;
}

export interface ExistingSSD {
	sizeGB: number;
	ageYears: number;
}

export type MachineType = 'none' | 'desktop' | 'laptop' | 'mini_pc' | 'enterprise' | 'nas';

export interface BYODConfig {
	machineType: MachineType;
	machineWattage: number | null;
	existingDrives: ExistingDrive[];
	existingSSDs: ExistingSSD[];
	hasUPS: boolean;
	hasNetworkingGear: boolean;
}

// ── Screen 3: Subscriptions ──

export interface ServiceCost {
	id: string;
	name: string;
	monthlyCost: number;
	enabled: boolean;
}

export interface StorageServiceCost extends ServiceCost {
	storageGB: number;
}

export interface OtherServiceCost {
	name: string;
	monthlyCost: number;
	category: string;
}

// Pre-defined subscription options
export const STREAMING_SERVICES: Omit<ServiceCost, 'enabled'>[] = [
	{ id: 'netflix', name: 'Netflix', monthlyCost: 15.49 },
	{ id: 'hulu', name: 'Hulu', monthlyCost: 17.99 },
	{ id: 'disney_plus', name: 'Disney+', monthlyCost: 13.99 },
	{ id: 'hbo_max', name: 'Max (HBO)', monthlyCost: 16.99 },
	{ id: 'peacock', name: 'Peacock', monthlyCost: 7.99 },
	{ id: 'paramount_plus', name: 'Paramount+', monthlyCost: 12.99 },
	{ id: 'apple_tv', name: 'Apple TV+', monthlyCost: 9.99 },
	{ id: 'amazon_prime', name: 'Prime Video', monthlyCost: 8.99 },
	{ id: 'youtube_premium', name: 'YouTube Premium', monthlyCost: 13.99 }
];

export const MUSIC_SERVICES: Omit<ServiceCost, 'enabled'>[] = [
	{ id: 'spotify', name: 'Spotify', monthlyCost: 11.99 },
	{ id: 'apple_music', name: 'Apple Music', monthlyCost: 10.99 },
	{ id: 'youtube_music', name: 'YouTube Music', monthlyCost: 10.99 },
	{ id: 'tidal', name: 'Tidal', monthlyCost: 10.99 },
	{ id: 'amazon_music', name: 'Amazon Music', monthlyCost: 9.99 }
];

export const CLOUD_STORAGE_SERVICES: Omit<StorageServiceCost, 'enabled'>[] = [
	{ id: 'google_one', name: 'Google One', monthlyCost: 2.99, storageGB: 200 },
	{ id: 'icloud', name: 'iCloud+', monthlyCost: 2.99, storageGB: 200 },
	{ id: 'dropbox', name: 'Dropbox', monthlyCost: 11.99, storageGB: 2000 },
	{ id: 'onedrive', name: 'OneDrive', monthlyCost: 1.99, storageGB: 100 }
];

export const PHOTO_BACKUP_SERVICES: Omit<ServiceCost, 'enabled'>[] = [
	{ id: 'google_photos', name: 'Google Photos', monthlyCost: 2.99 },
	{ id: 'icloud_photos', name: 'iCloud Photos', monthlyCost: 2.99 },
	{ id: 'amazon_photos', name: 'Amazon Photos', monthlyCost: 0 },
	{ id: 'flickr', name: 'Flickr Pro', monthlyCost: 8.25 }
];

export const VPN_SERVICES: Omit<ServiceCost, 'enabled'>[] = [
	{ id: 'mullvad', name: 'Mullvad', monthlyCost: 5.46 },
	{ id: 'nordvpn', name: 'NordVPN', monthlyCost: 4.59 },
	{ id: 'surfshark', name: 'Surfshark', monthlyCost: 2.49 },
	{ id: 'protonvpn', name: 'ProtonVPN', monthlyCost: 4.99 },
	{ id: 'ipvanish', name: 'IPVanish', monthlyCost: 3.33 },
	{ id: 'expressvpn', name: 'ExpressVPN', monthlyCost: 8.32 }
];

// ── Screen 4: Media ──

export type MediaAcquisition = 'physical' | 'digital' | 'existing' | 'other';
export type VideoQuality = '720p' | '1080p' | '4k' | '4k_hdr';
export type AutomationLevel = 'full' | 'semi' | 'manual';

// ── Screen 5: Photos ──

export type PhotoDeviceType = 'phone' | 'tablet' | 'dslr' | 'action_cam' | 'drone';
export type DeviceUsage = 'light' | 'moderate' | 'heavy';

export interface PhotoDevice {
	type: PhotoDeviceType;
	usage: DeviceUsage;
}

// Annual photo growth in GB per device usage level
export const PHOTO_GROWTH_PER_YEAR: Record<PhotoDeviceType, Record<DeviceUsage, number>> = {
	phone: { light: 5, moderate: 15, heavy: 40 },
	tablet: { light: 2, moderate: 8, heavy: 20 },
	dslr: { light: 10, moderate: 40, heavy: 100 },
	action_cam: { light: 5, moderate: 20, heavy: 60 },
	drone: { light: 10, moderate: 30, heavy: 80 }
};

// ── Screen 6: Files ──

export type BackupType = 'sync' | 'versioned' | 'both';
export type WorkOffServer = 'heavy' | 'occasional' | 'no';

export interface ComputerBackup {
	name: string;
	sizeGB: number;
}

// ── Screen 7: Network ──

export type RemoteAccess = 'none' | 'occasional' | 'regular' | 'share';

// ── Screen 8: Security ──

export type DataCriticality = 'replaceable' | 'important' | 'critical' | 'mission_critical';
export type RiskTolerance = 'minimal' | 'cautious' | 'standard' | 'advanced';
export type OffsiteBackup = 'cloud' | 'own_location' | 'no';

// ── Screen 9: Time ──

export type SetupTimeBudget = 'hours' | 'weekend' | 'take_time' | 'unlimited';
export type MaintenanceBudget = 'minimal' | 'some' | 'regular';
export type BreakTolerance = 'low' | 'medium' | 'high';
export type HelpAvailable = 'yes' | 'no' | 'ai';

export type UptimePreset =
	| '24_7'
	| 'daytime'
	| 'evenings_weekends'
	| 'weekends'
	| 'on_demand'
	| 'custom';

export interface UptimeSchedule {
	preset: UptimePreset;
	customHoursPerDay?: number;
	customDaysPerMonth?: number;
}

// Uptime hours per day for presets
export const UPTIME_HOURS: Record<Exclude<UptimePreset, 'custom'>, number> = {
	'24_7': 24,
	daytime: 16,
	evenings_weekends: 8,
	weekends: 8,
	on_demand: 4
};

export const UPTIME_DAYS_PER_MONTH: Record<Exclude<UptimePreset, 'custom'>, number> = {
	'24_7': 30.44,
	daytime: 30.44,
	evenings_weekends: 30.44,
	weekends: 8.7,
	on_demand: 15
};

// ── Complete Assessment State ──

export interface AssessmentState {
	// Screen 1: About You
	skillLevel: SkillLevel;
	householdSize: number;
	locationKey: string;
	electricityRate: number;
	currency: Currency;
	downloadSpeed: number;
	uploadSpeed: number;

	// Screen 2: Hardware
	byod: BYODConfig;

	// Screen 3: Subscriptions
	streamingServices: ServiceCost[];
	musicServices: ServiceCost[];
	cloudStorage: StorageServiceCost[];
	photoBackupServices: ServiceCost[];
	vpnService: ServiceCost | null;
	otherServices: OtherServiceCost[];

	// Screen 4: Media
	wantsMedia: boolean;
	mediaAcquisition: MediaAcquisition;
	videoQuality: VideoQuality;
	movieCount: number;
	tvSeasonCount: number;
	concurrentStreams: number;
	needsTranscoding: boolean;
	automationLevel: AutomationLevel;
	wantsMusic: boolean;
	musicLibrarySizeGB: number;
	wantsLossless: boolean;

	// Screen 5: Photos
	wantsPhotoBackup: boolean;
	photoDevices: PhotoDevice[];
	existingPhotoLibraryGB: number;
	wantsMLFeatures: boolean;

	// Screen 6: Files
	wantsFileSync: boolean;
	computers: ComputerBackup[];
	backupType: BackupType;
	worksOffServer: WorkOffServer;
	needsPersonalSpaces: boolean;

	// Screen 7: Network
	remoteAccess: RemoteAccess;
	comfortableWithPorts: boolean;
	wantsDomain: boolean;
	wantsAdBlocking: boolean;

	// Screen 8: Security
	dataCriticality: DataCriticality;
	riskTolerance: RiskTolerance;
	wantsOffsiteBackup: OffsiteBackup;
	wantsUPS: boolean;

	// Screen 9: Time
	setupTimeBudget: SetupTimeBudget;
	maintenanceBudget: MaintenanceBudget;
	breakTolerance: BreakTolerance;
	helpAvailable: HelpAvailable;
	uptimeSchedule: UptimeSchedule;
}

export const DEFAULT_ASSESSMENT: AssessmentState = {
	// Screen 1
	skillLevel: 'beginner',
	householdSize: 2,
	locationKey: 'us_avg',
	electricityRate: 0.16,
	currency: 'USD',
	downloadSpeed: 100,
	uploadSpeed: 10,

	// Screen 2
	byod: {
		machineType: 'none',
		machineWattage: null,
		existingDrives: [],
		existingSSDs: [],
		hasUPS: false,
		hasNetworkingGear: false
	},

	// Screen 3
	streamingServices: STREAMING_SERVICES.map((s) => ({ ...s, enabled: false })),
	musicServices: MUSIC_SERVICES.map((s) => ({ ...s, enabled: false })),
	cloudStorage: CLOUD_STORAGE_SERVICES.map((s) => ({ ...s, enabled: false })),
	photoBackupServices: PHOTO_BACKUP_SERVICES.map((s) => ({ ...s, enabled: false })),
	vpnService: null,
	otherServices: [],

	// Screen 4
	wantsMedia: true,
	mediaAcquisition: 'other',
	videoQuality: '1080p',
	movieCount: 50,
	tvSeasonCount: 10,
	concurrentStreams: 2,
	needsTranscoding: false,
	automationLevel: 'full',
	wantsMusic: false,
	musicLibrarySizeGB: 0,
	wantsLossless: false,

	// Screen 5
	wantsPhotoBackup: false,
	photoDevices: [],
	existingPhotoLibraryGB: 0,
	wantsMLFeatures: false,

	// Screen 6
	wantsFileSync: false,
	computers: [],
	backupType: 'sync',
	worksOffServer: 'no',
	needsPersonalSpaces: false,

	// Screen 7
	remoteAccess: 'none',
	comfortableWithPorts: false,
	wantsDomain: false,
	wantsAdBlocking: false,

	// Screen 8
	dataCriticality: 'important',
	riskTolerance: 'cautious',
	wantsOffsiteBackup: 'no',
	wantsUPS: false,

	// Screen 9
	setupTimeBudget: 'weekend',
	maintenanceBudget: 'some',
	breakTolerance: 'medium',
	helpAvailable: 'ai',
	uptimeSchedule: { preset: '24_7' }
};
