import type { AssessmentState } from '$lib/types/assessment';
import { PHOTO_GROWTH_PER_YEAR } from '$lib/types/assessment';
import type { CalculationDefaults } from '$lib/types/defaults';

export interface StorageBreakdown {
	mediaGB: number;
	musicGB: number;
	photosGB: number;
	filesGB: number;
	systemGB: number;
	rawTotalGB: number;
	withHeadroomGB: number;
}

const MOVIE_SIZE_MAP = {
	'720p': 'movieSize720p',
	'1080p': 'movieSize1080p',
	'4k': 'movieSize4k',
	'4k_hdr': 'movieSize4kHdr'
} as const;

const EPISODE_SIZE_MAP = {
	'720p': 'episodeSize720p',
	'1080p': 'episodeSize1080p',
	'4k': 'episodeSize4k',
	'4k_hdr': 'episodeSize4kHdr'
} as const;

export function estimateStorage(
	state: AssessmentState,
	defaults: CalculationDefaults
): StorageBreakdown {
	// Media
	let mediaGB = 0;
	if (state.wantsMedia) {
		const movieSize = defaults[MOVIE_SIZE_MAP[state.videoQuality]];
		const episodeSize = defaults[EPISODE_SIZE_MAP[state.videoQuality]];
		const currentMedia =
			state.movieCount * movieSize +
			state.tvSeasonCount * defaults.avgEpisodesPerSeason * episodeSize;
		// Project growth
		mediaGB = currentMedia * (1 + defaults.mediaGrowthRateAnnual * defaults.growthProjectionYears);
	}

	// Music
	let musicGB = 0;
	if (state.wantsMusic) {
		musicGB = state.wantsLossless ? state.musicLibrarySizeGB * 4 : state.musicLibrarySizeGB;
	}

	// Photos
	let photosGB = 0;
	if (state.wantsPhotoBackup) {
		const annualGrowth = state.photoDevices.reduce(
			(sum, d) => sum + (PHOTO_GROWTH_PER_YEAR[d.type]?.[d.usage] ?? 0),
			0
		);
		photosGB = state.existingPhotoLibraryGB + annualGrowth * defaults.growthProjectionYears;
	}

	// Files
	let filesGB = 0;
	if (state.wantsFileSync) {
		const rawFiles = state.computers.reduce((sum, c) => sum + c.sizeGB, 0);
		const versionMultiplier =
			state.backupType === 'versioned' || state.backupType === 'both'
				? defaults.versioningMultiplierBasic
				: defaults.versioningMultiplierNone;
		filesGB =
			rawFiles * versionMultiplier * (1 + defaults.fileGrowthRateAnnual * defaults.growthProjectionYears);
	}

	const systemGB = defaults.systemOverheadGB;
	const rawTotalGB = mediaGB + musicGB + photosGB + filesGB + systemGB;
	const withHeadroomGB = rawTotalGB * defaults.storageHeadroomMultiplier;

	return { mediaGB, musicGB, photosGB, filesGB, systemGB, rawTotalGB, withHeadroomGB };
}
