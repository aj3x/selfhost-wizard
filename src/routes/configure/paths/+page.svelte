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

	<!-- Path inputs -->
	<div class="mb-6 rounded-xl border border-(--color-border) p-4">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Base Paths</h2>
		<div class="space-y-3">
			<div class="flex items-center gap-3">
				<span class="min-w-[120px] text-sm font-medium">Base Directory</span>
				<input
					type="text"
					value={gc.baseDir}
					oninput={(e) => configurator.updateGlobalConfig({ baseDir: e.currentTarget.value })}
					class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
				/>
			</div>
			<div class="flex items-center gap-3">
				<span class="min-w-[120px] text-sm">Config</span>
				<input
					type="text"
					value={gc.configDir}
					oninput={(e) => configurator.updateGlobalConfig({ configDir: e.currentTarget.value })}
					class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
				/>
			</div>
			{#if hasMedia}
				<div class="flex items-center gap-3">
					<span class="min-w-[120px] text-sm">Media</span>
					<input
						type="text"
						value={gc.mediaDir}
						oninput={(e) => configurator.updateGlobalConfig({ mediaDir: e.currentTarget.value })}
						class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
					/>
				</div>
			{/if}
			{#if hasPhotos}
				<div class="flex items-center gap-3">
					<span class="min-w-[120px] text-sm">Photos</span>
					<input
						type="text"
						value={gc.photoDir}
						oninput={(e) => configurator.updateGlobalConfig({ photoDir: e.currentTarget.value })}
						class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
					/>
				</div>
			{/if}
			{#if hasFiles}
				<div class="flex items-center gap-3">
					<span class="min-w-[120px] text-sm">Files</span>
					<input
						type="text"
						value={gc.filesDir}
						oninput={(e) => configurator.updateGlobalConfig({ filesDir: e.currentTarget.value })}
						class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
					/>
				</div>
			{/if}
			{#if hasBackup}
				<div class="flex items-center gap-3">
					<span class="min-w-[120px] text-sm">Backups</span>
					<input
						type="text"
						value={gc.backupDir}
						oninput={(e) => configurator.updateGlobalConfig({ backupDir: e.currentTarget.value })}
						class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
					/>
				</div>
			{/if}
		</div>
		<p class="mt-3 text-xs text-(--color-text-muted)">
			Tip: Put configs on your SSD and media on your HDD for best performance.
			Use <code class="rounded bg-(--color-surface-alt) px-1">${'{BASE_DIR}'}</code> to reference the base path.
		</p>
	</div>

	<!-- Directory tree preview -->
	<div class="mb-6 rounded-xl border border-(--color-border) p-4">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Directory Preview</h2>
		<div class="rounded-lg bg-(--color-surface-alt) p-4 font-mono text-sm">
			{#each dirTree as dir}
				<div style="padding-left: {dir.indent * 1.5}rem" class="leading-relaxed">
					{#if dir.indent === 0}
						<span class="font-bold">{dir.label}/</span>
					{:else}
						<span class="text-(--color-text-muted)">├── </span>{dir.label}
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Media path explanation -->
	{#if hasMedia}
		<div class="rounded-xl border border-(--color-border) bg-(--color-surface-alt)/50 p-4">
			<h3 class="mb-1 text-sm font-semibold">Why a unified media path?</h3>
			<p class="text-xs text-(--color-text-muted)">
				The *arr apps and download clients share a common <code class="rounded bg-(--color-surface-alt) px-1">/media</code>
				parent so completed downloads can be hardlinked (instant, no extra disk space) instead of copied.
				This is critical for efficient storage use.
			</p>
		</div>
	{/if}
</div>
