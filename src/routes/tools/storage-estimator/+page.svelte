<script lang="ts">
	import { FACTORY_DEFAULTS } from '$lib/types/defaults';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';

	let videoQuality: 'none' | '720p' | '1080p' | '4k' | '4k_hdr' = $state('1080p');
	let movieCount = $state(100);
	let tvSeasons = $state(20);
	let musicGB = $state(0);
	let wantsLossless = $state(false);
	let photoLibraryGB = $state(0);
	let photoGrowthGB = $state(30);
	let fileBackupGB = $state(0);

	const d = FACTORY_DEFAULTS;

	const MOVIE_SIZES = { '720p': d.movieSize720p, '1080p': d.movieSize1080p, '4k': d.movieSize4k, '4k_hdr': d.movieSize4kHdr };
	const EPISODE_SIZES = { '720p': d.episodeSize720p, '1080p': d.episodeSize1080p, '4k': d.episodeSize4k, '4k_hdr': d.episodeSize4kHdr };

	let mediaGB = $derived.by(() => {
		if (videoQuality === 'none') return 0;
		const q = videoQuality;
		return movieCount * MOVIE_SIZES[q] + tvSeasons * d.avgEpisodesPerSeason * EPISODE_SIZES[q];
	});

	let totalMusicGB = $derived(wantsLossless ? musicGB * 4 : musicGB);
	let photosProjectedGB = $derived(photoLibraryGB + photoGrowthGB * d.growthProjectionYears);
	let rawTotalGB = $derived(mediaGB + totalMusicGB + photosProjectedGB + fileBackupGB + d.systemOverheadGB);
	let withHeadroomGB = $derived(rawTotalGB * d.storageHeadroomMultiplier);

	function fmtStorage(gb: number): string {
		if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
		return `${Math.round(gb)} GB`;
	}
</script>

<svelte:head>
	<title>Storage Estimator — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href="/tools" class="mb-4 inline-block text-sm text-(--color-primary) hover:underline">&larr; All Tools</a>
	<h1 class="mb-2 text-2xl font-bold">Storage Estimator</h1>
	<p class="mb-6 text-(--color-text-muted)">How much disk space will you need?</p>

	<div class="mb-6 rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/5 p-4 text-center">
		<div class="text-sm text-(--color-text-muted)">Total estimated storage</div>
		<div class="text-2xl font-bold text-(--color-primary)">{fmtStorage(withHeadroomGB)}</div>
		<div class="text-sm text-(--color-text-muted)">({fmtStorage(rawTotalGB)} + 15% headroom)</div>
	</div>

	<div class="space-y-6">
		<div>
			<h3 class="mb-2 font-semibold">Media</h3>
			<div class="mb-3">
				<span class="mb-1 block text-sm text-(--color-text-muted)">Video quality</span>
				<SingleSelect
					options={[
						{ value: 'none', label: 'No media' },
						{ value: '720p', label: '720p' },
						{ value: '1080p', label: '1080p' },
						{ value: '4k', label: '4K' },
						{ value: '4k_hdr', label: '4K HDR' }
					]}
					bind:value={videoQuality}
					columns={3}
				/>
			</div>
			{#if videoQuality !== 'none'}
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="movies" class="mb-1 block text-sm text-(--color-text-muted)">Movies</label>
						<NumberInput id="movies" bind:value={movieCount} min={0} max={10000} step={10} />
					</div>
					<div>
						<label for="tvSeasons" class="mb-1 block text-sm text-(--color-text-muted)">TV Seasons</label>
						<NumberInput id="tvSeasons" bind:value={tvSeasons} min={0} max={5000} step={5} />
					</div>
				</div>
				<p class="mt-2 text-sm text-(--color-text-muted)">Media: {fmtStorage(mediaGB)}</p>
			{/if}
		</div>

		<div>
			<h3 class="mb-2 font-semibold">Music</h3>
			<NumberInput bind:value={musicGB} min={0} max={5000} step={10} suffix="GB" />
			<label class="mt-2 flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={wantsLossless} class="accent-(--color-primary)" />
				Lossless (FLAC) — 4x larger
			</label>
			{#if musicGB > 0}
				<p class="mt-1 text-sm text-(--color-text-muted)">Music: {fmtStorage(totalMusicGB)}</p>
			{/if}
		</div>

		<div>
			<h3 class="mb-2 font-semibold">Photos</h3>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="existingPhotos" class="mb-1 block text-sm text-(--color-text-muted)">Existing library</label>
					<NumberInput id="existingPhotos" bind:value={photoLibraryGB} min={0} max={50000} step={10} suffix="GB" />
				</div>
				<div>
					<label for="photoGrowth" class="mb-1 block text-sm text-(--color-text-muted)">Annual growth</label>
					<NumberInput id="photoGrowth" bind:value={photoGrowthGB} min={0} max={2000} step={5} suffix="GB/yr" />
				</div>
			</div>
			{#if photoLibraryGB > 0 || photoGrowthGB > 0}
				<p class="mt-2 text-sm text-(--color-text-muted)">Photos ({d.growthProjectionYears}yr projection): {fmtStorage(photosProjectedGB)}</p>
			{/if}
		</div>

		<div>
			<h3 class="mb-2 font-semibold">File Backups</h3>
			<NumberInput bind:value={fileBackupGB} min={0} max={50000} step={50} suffix="GB" />
		</div>
	</div>
</div>
