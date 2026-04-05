<script lang="ts">
	import { configurator } from '$lib/stores/configurator';
	import { findService } from '$lib/services/registry';

	let gc = $derived($configurator.globalConfig);
	let allIds = $derived([...$configurator.selectedServices, ...$configurator.resolvedDependencies]);

	let hasMedia = $derived(allIds.some((id) => ['sonarr', 'radarr', 'jellyfin', 'plex', 'lidarr', 'tdarr', 'bazarr'].includes(id)));
	let hasPhotos = $derived(allIds.includes('immich'));
	let hasFiles = $derived(allIds.some((id) => ['nextcloud', 'syncthing', 'filebrowser'].includes(id)));
	let hasBackup = $derived(allIds.some((id) => ['duplicati', 'kopia'].includes(id)));
	let hasMusic = $derived(allIds.includes('lidarr'));

	// Build directory tree for display
	let dirTree = $derived.by(() => {
		const base = gc.baseDir;
		const dirs: { path: string; label: string; indent: number }[] = [
			{ path: base, label: base, indent: 0 }
		];

		// Config
		dirs.push({ path: 'config/', label: 'config/', indent: 1 });
		for (const id of allIds) {
			const svc = findService(id);
			if (svc) {
				dirs.push({ path: `config/${id}/`, label: `${id}/`, indent: 2 });
			}
		}

		// Media
		if (hasMedia) {
			dirs.push({ path: 'media/', label: 'media/', indent: 1 });
			dirs.push({ path: 'media/movies/', label: 'movies/', indent: 2 });
			dirs.push({ path: 'media/tv/', label: 'tv/', indent: 2 });
			if (hasMusic) {
				dirs.push({ path: 'media/music/', label: 'music/', indent: 2 });
			}
			dirs.push({ path: 'media/downloads/', label: 'downloads/', indent: 2 });
			dirs.push({ path: 'media/downloads/complete/', label: 'complete/', indent: 3 });
			dirs.push({ path: 'media/downloads/incomplete/', label: 'incomplete/', indent: 3 });
		}

		// Photos
		if (hasPhotos) {
			dirs.push({ path: 'photos/', label: 'photos/', indent: 1 });
		}

		// Files
		if (hasFiles) {
			dirs.push({ path: 'files/', label: 'files/', indent: 1 });
		}

		// Backups
		if (hasBackup) {
			dirs.push({ path: 'backups/', label: 'backups/', indent: 1 });
		}

		return dirs;
	});
</script>

<svelte:head>
	<title>Paths — SelfHost Wizard</title>
</svelte:head>

<div>
	<h1 class="mb-2 text-2xl font-bold">Paths & Directory Structure</h1>
	<p class="mb-6 text-(--color-text-muted)">
		Configure where your data will live. The setup script will create this structure for you.
	</p>

	{#if allIds.length === 0}
		<div class="card p-8 text-center text-(--color-text-muted)">
			<p class="text-lg font-medium">No services selected</p>
			<p class="mt-1 text-sm">Go back to select some services first.</p>
		</div>
	{:else}

	<fieldset class="card mb-6">
		<legend class="section-heading">Base Paths</legend>
		<div class="space-y-3">
			<div class="field-row">
				<label for="path-base" class="min-w-[120px] text-sm font-medium">Base Directory</label>
				<input
					id="path-base"
					type="text"
					value={gc.baseDir}
					oninput={(e) => configurator.updateGlobalConfig({ baseDir: e.currentTarget.value })}
					class="input-mono"
				/>
			</div>
			<div class="field-row">
				<label for="path-config" class="min-w-[120px] text-sm">Config</label>
				<input
					id="path-config"
					type="text"
					value={gc.configDir}
					oninput={(e) => configurator.updateGlobalConfig({ configDir: e.currentTarget.value })}
					class="input-mono"
				/>
			</div>
			{#if hasMedia}
				<div class="field-row">
					<label for="path-media" class="min-w-[120px] text-sm">Media</label>
					<input
						id="path-media"
						type="text"
						value={gc.mediaDir}
						oninput={(e) => configurator.updateGlobalConfig({ mediaDir: e.currentTarget.value })}
						class="input-mono"
					/>
				</div>
			{/if}
			{#if hasPhotos}
				<div class="field-row">
					<label for="path-photos" class="min-w-[120px] text-sm">Photos</label>
					<input
						id="path-photos"
						type="text"
						value={gc.photoDir}
						oninput={(e) => configurator.updateGlobalConfig({ photoDir: e.currentTarget.value })}
						class="input-mono"
					/>
				</div>
			{/if}
			{#if hasFiles}
				<div class="field-row">
					<label for="path-files" class="min-w-[120px] text-sm">Files</label>
					<input
						id="path-files"
						type="text"
						value={gc.filesDir}
						oninput={(e) => configurator.updateGlobalConfig({ filesDir: e.currentTarget.value })}
						class="input-mono"
					/>
				</div>
			{/if}
			{#if hasBackup}
				<div class="field-row">
					<label for="path-backups" class="min-w-[120px] text-sm">Backups</label>
					<input
						id="path-backups"
						type="text"
						value={gc.backupDir}
						oninput={(e) => configurator.updateGlobalConfig({ backupDir: e.currentTarget.value })}
						class="input-mono"
					/>
				</div>
			{/if}
		</div>
		<p class="mt-3 hint">
			Tip: Put configs on your SSD and media on your HDD for best performance.
			Use <code class="rounded bg-(--color-surface-alt) px-1">${'{BASE_DIR}'}</code> to reference the base path.
		</p>
	</fieldset>

	<section class="card mb-6" aria-labelledby="dir-preview-heading">
		<h2 id="dir-preview-heading" class="section-heading">Directory Preview</h2>
		<div class="rounded-lg bg-(--color-surface-alt) p-4 font-mono text-sm" role="img" aria-label="Directory tree structure">
			{#each dirTree as dir}
				<div style="padding-left: {dir.indent * 1.5}rem" class="leading-relaxed">
					{#if dir.indent === 0}
						<span class="font-bold">{dir.label}/</span>
					{:else}
						<span class="text-(--color-text-muted)" aria-hidden="true">├── </span>{dir.label}
					{/if}
				</div>
			{/each}
		</div>
	</section>

	{#if hasMedia}
		<section class="card bg-(--color-surface-alt)/50" aria-labelledby="media-path-heading">
			<h3 id="media-path-heading" class="mb-1 text-sm font-semibold">Why a unified media path?</h3>
			<p class="hint">
				The *arr apps and download clients share a common <code class="rounded bg-(--color-surface-alt) px-1">/media</code>
				parent so completed downloads can be hardlinked (instant, no extra disk space) instead of copied.
				This is critical for efficient storage use.
			</p>
		</section>
	{/if}

	{/if}
</div>
