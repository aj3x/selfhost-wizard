<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { defaults } from '$lib/stores/defaults';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Tooltip from '$lib/components/wizard/Tooltip.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';
	import RecommendedBadge from '$lib/components/shared/RecommendedBadge.svelte';

	let skill = $derived($assessment.skillLevel);
	let isBeginner = $derived(skill === 'beginner');

	let movieSizeGB = $derived(
		({
			'720p': $defaults.movieSize720p,
			'1080p': $defaults.movieSize1080p,
			'4k': $defaults.movieSize4k,
			'4k_hdr': $defaults.movieSize4kHdr
		})[$assessment.videoQuality]
	);

	let episodeSizeGB = $derived(
		({
			'720p': $defaults.episodeSize720p,
			'1080p': $defaults.episodeSize1080p,
			'4k': $defaults.episodeSize4k,
			'4k_hdr': $defaults.episodeSize4kHdr
		})[$assessment.videoQuality]
	);

	let estimatedMediaTB = $derived(
		(
			($assessment.movieCount * movieSizeGB +
				$assessment.tvSeasonCount * $defaults.avgEpisodesPerSeason * episodeSizeGB) /
			1000
		).toFixed(1)
	);

	let musicStorageLabel = $derived(
		$assessment.wantsLossless
			? `~${Math.round($assessment.musicLibrarySizeGB * 4)} GB (FLAC)`
			: `~${$assessment.musicLibrarySizeGB} GB (MP3/AAC)`
	);

	// Spec: show transcoding question when streams > 1 or quality is 4K
	let showTranscoding = $derived(
		$assessment.concurrentStreams > 1 || $assessment.videoQuality === '4k' || $assessment.videoQuality === '4k_hdr'
	);

	// Spec: show automation when not "buy digital copies only"
	let showAutomation = $derived($assessment.mediaAcquisition !== 'digital');

	// Beginner library size presets
	function setBeginnerLibrary(preset: 'small' | 'medium' | 'large' | 'unsure') {
		const presets = {
			small: { movies: 75, seasons: 10 },
			medium: { movies: 300, seasons: 40 },
			large: { movies: 1000, seasons: 100 },
			unsure: { movies: 50, seasons: 5 }
		};
		$assessment.movieCount = presets[preset].movies;
		$assessment.tvSeasonCount = presets[preset].seasons;
	}
</script>

<h1 class="mb-2 text-2xl font-bold">Media Habits</h1>
<p class="mb-8 text-(--color-text-muted)">
	Tell us about your media consumption so we can estimate storage and hardware needs.
</p>

<QuestionGroup label="Are you interested in self-hosting media (movies, TV)?">
	<SingleSelect
		options={[
			{ value: 'true', label: 'Yes', description: isBeginner ? 'Host your own Netflix-like library at home' : 'I want to host my own Plex/Jellyfin' },
			{ value: 'false', label: 'No', description: "I'll keep using streaming services" }
		]}
		value={String($assessment.wantsMedia)}
		onchange={(v) => ($assessment.wantsMedia = v === 'true')}
		columns={2}
	/>
</QuestionGroup>

<ConditionalSection visible={$assessment.wantsMedia}>
	{#if isBeginner}
		<Alert type="beginner">
			Self-hosting media means running your own streaming server (like Jellyfin or Plex) with movies and TV shows
			you own. You'll need to provide the media files — this replaces the <em>player</em>, not the <em>content</em>.
		</Alert>
	{/if}

	<QuestionGroup label="How will you get your media?">
		<SingleSelect
			options={[
				{ value: 'physical', label: 'Buy & rip physical', description: 'Blu-ray, DVD ripping' },
				{ value: 'digital', label: 'Buy digital copies', description: 'iTunes, Vudu, etc.' },
				{ value: 'existing', label: 'Existing library', description: 'I already have files' },
				{ value: 'other', label: 'Other / Mix', description: "I'd rather not say" }
			]}
			bind:value={$assessment.mediaAcquisition}
			columns={2}
		/>
		{#if $assessment.mediaAcquisition === 'other'}
			<p class="mt-2 text-xs text-(--color-text-muted)">
				No worries — we'll estimate infrastructure costs only. Content acquisition costs aren't included.
			</p>
		{/if}
	</QuestionGroup>

	<QuestionGroup label="Preferred video quality">
		<SingleSelect
			options={[
				{ value: '720p', label: '720p', description: `~${$defaults.movieSize720p} GB/movie — saves space` },
				{ value: '1080p', label: '1080p', description: `~${$defaults.movieSize1080p} GB/movie — good balance` },
				{ value: '4k', label: '4K', description: `~${$defaults.movieSize4k} GB/movie — high quality` },
				{ value: '4k_hdr', label: '4K HDR', description: `~${$defaults.movieSize4kHdr} GB/movie — best quality` }
			]}
			bind:value={$assessment.videoQuality}
			columns={isBeginner ? 2 : 4}
		/>
		{#if isBeginner}
			<p class="mt-2 text-sm text-(--color-text-muted)">
				<RecommendedBadge show={$assessment.videoQuality !== '1080p'} />
				{#if $assessment.videoQuality === '4k' || $assessment.videoQuality === '4k_hdr'}
					4K looks amazing but uses 5-10x more storage than 1080p. Make sure you have 4K screens to benefit.
				{:else if $assessment.videoQuality === '720p'}
					Fine for phones and small screens, but you may want to upgrade later.
				{:else}
					1080p is the sweet spot for most people — great quality without massive storage.
				{/if}
			</p>
		{/if}
	</QuestionGroup>

	<QuestionGroup label="How large will your library be?">
		{#if isBeginner}
			<p class="mb-3 text-sm text-(--color-text-muted)">Pick what best describes your goal:</p>
			<SingleSelect
				options={[
					{ value: 'unsure', label: 'Start small', description: '~50 movies, a few shows' },
					{ value: 'small', label: 'The favorites', description: '~75 movies, ~10 TV seasons' },
					{ value: 'medium', label: 'Solid library', description: '~300 movies, ~40 TV seasons' },
					{ value: 'large', label: 'Everything', description: '1000+ movies, 100+ seasons' }
				]}
				value="custom"
				onchange={(v) => setBeginnerLibrary(v as 'small' | 'medium' | 'large' | 'unsure')}
	columns={2}
			/>
			<p class="mt-2 text-xs text-(--color-text-muted)">Or set exact numbers below:</p>
		{/if}
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="movieCount" class="mb-1 block text-sm text-(--color-text-muted)">Movies</label>
				<NumberInput id="movieCount" bind:value={$assessment.movieCount} min={0} max={10000} step={10} />
			</div>
			<div>
				<label for="tvSeasons" class="mb-1 block text-sm text-(--color-text-muted)">TV Seasons</label>
				<NumberInput id="tvSeasons" bind:value={$assessment.tvSeasonCount} min={0} max={5000} step={5} />
			</div>
		</div>
		<div class="mt-3 rounded-lg bg-(--color-surface-alt) p-3 text-sm">
			Estimated storage: <strong>{estimatedMediaTB} TB</strong>
			{#if !isBeginner}
				<Tooltip text="Based on average file sizes for your chosen quality. Actual sizes vary by encode." />
			{/if}
		</div>
	</QuestionGroup>

	<QuestionGroup label="How many people will stream at the same time?">
		<SingleSelect
			options={[
				{ value: '1', label: 'Just me' },
				{ value: '2', label: '2-3 people' },
				{ value: '4', label: '4-5 people' },
				{ value: '6', label: '6+ people' }
			]}
			value={String($assessment.concurrentStreams)}
			onchange={(v) => ($assessment.concurrentStreams = parseInt(v))}
			columns={4}
		/>
	</QuestionGroup>

	{#if showTranscoding}
		<QuestionGroup label="Will your devices direct-play most content?">
			{#if isBeginner}
				<Alert type="info">
					"Direct-play" means your TV or device can play the video file as-is. Most modern smart TVs, Apple TV 4K,
					and Nvidia Shield can do this. Older TVs, Chromecast, and browser playback often need the server to
					convert the video on the fly, which requires more processing power.
				</Alert>
			{/if}
			<SingleSelect
				options={[
					{
						value: 'false',
						label: 'Yes, mostly direct play',
						description: isBeginner ? 'Modern smart TV, Apple TV 4K, Shield' : 'All devices support your media format natively'
					},
					{
						value: 'true',
						label: 'Some transcoding needed',
						description: isBeginner ? 'Older TVs, Chromecast, phones' : 'Some devices need format conversion (more CPU needed)'
					}
				]}
				value={String($assessment.needsTranscoding)}
				onchange={(v) => ($assessment.needsTranscoding = v === 'true')}
				columns={2}
			/>
		</QuestionGroup>
	{/if}

	{#if showAutomation}
		<QuestionGroup label="Media automation">
			{#if isBeginner}
				<p class="mb-2 text-sm text-(--color-text-muted)">
					Tools like Sonarr and Radarr can automatically find, download, and organize your media.
					They monitor for new episodes and keep your library organized.
				</p>
			{/if}
			<SingleSelect
				options={[
					{ value: 'full', label: 'Fully automated', description: 'Auto-download new episodes and movies' },
					{ value: 'semi', label: 'Semi-automated', description: 'Search and approve manually' },
					{ value: 'manual', label: 'Manual', description: "I'll manage files myself" }
				]}
				bind:value={$assessment.automationLevel}
				columns={3}
			/>
			{#if isBeginner && $assessment.automationLevel === 'full'}
				<p class="mt-2 text-sm text-(--color-text-muted)">
					<RecommendedBadge />
					This is one of the biggest wins of self-hosting — new episodes download automatically.
				</p>
			{/if}
		</QuestionGroup>
	{/if}

	<QuestionGroup label="Self-hosted music?">
		<SingleSelect
			options={[
				{ value: 'replace', label: 'Replace streaming', description: isBeginner ? 'Host your own Spotify-like library' : 'Lidarr + Navidrome/Jellyfin' },
				{ value: 'organize', label: 'Organize existing', description: 'I have music files I want to manage' },
				{ value: 'false', label: 'No', description: "I'll keep using streaming" }
			]}
			value={$assessment.wantsMusic ? ($assessment.musicLibrarySizeGB > 0 ? 'organize' : 'replace') : 'false'}
			onchange={(v) => ($assessment.wantsMusic = v !== 'false')}
			columns={3}
		/>
	</QuestionGroup>

	<ConditionalSection visible={$assessment.wantsMusic}>
		<QuestionGroup label="Music library size" description={isBeginner ? "Small = under 50 GB, Medium = 50-500 GB, Large = 500 GB+" : "In GB, MP3/AAC equivalent"}>
			<NumberInput bind:value={$assessment.musicLibrarySizeGB} min={0} max={5000} step={10} suffix="GB" />
		</QuestionGroup>

		<QuestionGroup label="Want lossless quality (FLAC)?">
			<SingleSelect
				options={[
					{ value: 'false', label: 'Standard (MP3/AAC)', description: 'Normal quality, smaller files' },
					{ value: 'true', label: 'Lossless (FLAC)', description: '~4x larger files, audiophile quality' }
				]}
				value={String($assessment.wantsLossless)}
				onchange={(v) => ($assessment.wantsLossless = v === 'true')}
				columns={2}
			/>
			{#if $assessment.musicLibrarySizeGB > 0}
				<p class="mt-2 text-sm text-(--color-text-muted)">
					Estimated music storage: {musicStorageLabel}
				</p>
			{/if}
		</QuestionGroup>
	</ConditionalSection>
</ConditionalSection>
