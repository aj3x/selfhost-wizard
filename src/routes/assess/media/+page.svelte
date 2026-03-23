<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { defaults } from '$lib/stores/defaults';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Tooltip from '$lib/components/wizard/Tooltip.svelte';

	// Real-time storage estimate
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
</script>

<h1 class="mb-2 text-2xl font-bold">Media Habits</h1>
<p class="mb-8 text-(--color-text-muted)">
	Tell us about your media consumption so we can estimate storage and hardware needs.
</p>

<QuestionGroup label="Are you interested in self-hosting media (movies, TV, music)?">
	<SingleSelect
		options={[
			{ value: 'true', label: 'Yes', description: 'I want to host my own Plex/Jellyfin' },
			{ value: 'false', label: 'No', description: "I'll keep using streaming services" }
		]}
		value={String($assessment.wantsMedia)}
		onchange={(v) => ($assessment.wantsMedia = v === 'true')}
		columns={2}
	/>
</QuestionGroup>

<ConditionalSection visible={$assessment.wantsMedia}>
	<QuestionGroup label="How do you acquire media?">
		<SingleSelect
			options={[
				{ value: 'physical', label: 'Buy/rip physical', description: 'Blu-ray, DVD, CD ripping' },
				{ value: 'digital', label: 'Buy digital', description: 'iTunes, Vudu, etc.' },
				{ value: 'existing', label: 'Existing library', description: 'Already have files' },
				{ value: 'other', label: 'Other / Mix', description: 'Various sources' }
			]}
			bind:value={$assessment.mediaAcquisition}
			columns={2}
		/>
	</QuestionGroup>

	<QuestionGroup label="Preferred video quality">
		<SingleSelect
			options={[
				{ value: '720p', label: '720p', description: 'Smallest files (~2 GB/movie)' },
				{ value: '1080p', label: '1080p', description: 'Good balance (~6 GB/movie)' },
				{ value: '4k', label: '4K', description: 'High quality (~30 GB/movie)' },
				{ value: '4k_hdr', label: '4K HDR / Dolby Vision', description: 'Best quality (~60 GB/movie)' }
			]}
			bind:value={$assessment.videoQuality}
			columns={2}
		/>
	</QuestionGroup>

	<QuestionGroup label="Library size">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="mb-1 block text-sm text-(--color-text-muted)">Movies</label>
				<NumberInput bind:value={$assessment.movieCount} min={0} max={10000} step={10} />
			</div>
			<div>
				<label class="mb-1 block text-sm text-(--color-text-muted)">TV Seasons</label>
				<NumberInput bind:value={$assessment.tvSeasonCount} min={0} max={5000} step={5} />
			</div>
		</div>
		<div class="mt-3 rounded-lg bg-(--color-surface-alt) p-3 text-sm">
			Estimated storage: <strong>{estimatedMediaTB} TB</strong>
			<Tooltip text="Based on average file sizes for your chosen quality. Actual sizes vary by encode." />
		</div>
	</QuestionGroup>

	<QuestionGroup label="Concurrent streams">
		<SingleSelect
			options={[
				{ value: '1', label: '1 stream' },
				{ value: '2', label: '2-3 streams' },
				{ value: '4', label: '4-5 streams' },
				{ value: '6', label: '6+ streams' }
			]}
			value={String($assessment.concurrentStreams)}
			onchange={(v) => ($assessment.concurrentStreams = parseInt(v))}
			columns={4}
		/>
	</QuestionGroup>

	<QuestionGroup label="Will devices need transcoding?">
		<SingleSelect
			options={[
				{
					value: 'false',
					label: 'No — direct play',
					description: 'All devices support your media format natively'
				},
				{
					value: 'true',
					label: 'Yes — some transcoding',
					description: 'Some devices need format conversion (more CPU needed)'
				}
			]}
			value={String($assessment.needsTranscoding)}
			onchange={(v) => ($assessment.needsTranscoding = v === 'true')}
			columns={2}
		/>
	</QuestionGroup>

	<QuestionGroup label="Media automation level">
		<SingleSelect
			options={[
				{ value: 'full', label: 'Fully automated', description: 'Sonarr + Radarr auto-download new episodes/movies' },
				{ value: 'semi', label: 'Semi-automated', description: 'Search and approve manually' },
				{ value: 'manual', label: 'Manual', description: "I'll manage files myself" }
			]}
			bind:value={$assessment.automationLevel}
			columns={3}
		/>
	</QuestionGroup>

	<QuestionGroup label="Music">
		<SingleSelect
			options={[
				{ value: 'true', label: 'Yes', description: 'I want to host my own music library' },
				{ value: 'false', label: 'No', description: "I'll keep using streaming" }
			]}
			value={String($assessment.wantsMusic)}
			onchange={(v) => ($assessment.wantsMusic = v === 'true')}
			columns={2}
		/>
	</QuestionGroup>

	<ConditionalSection visible={$assessment.wantsMusic}>
		<QuestionGroup label="Music library size (in GB, MP3 equivalent)">
			<NumberInput bind:value={$assessment.musicLibrarySizeGB} min={0} max={5000} step={10} suffix="GB" />
		</QuestionGroup>

		<QuestionGroup label="Want lossless quality (FLAC)?">
			<SingleSelect
				options={[
					{ value: 'false', label: 'MP3/AAC is fine', description: 'Standard quality, smaller files' },
					{ value: 'true', label: 'Yes, lossless (FLAC)', description: '~4x larger files, audiophile quality' }
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
