<script lang="ts">
	import { configurator } from '$lib/stores/configurator';
	import { findService } from '$lib/services/registry';
	import { generateAll, collectNetworks, generateCompose } from '$lib/calc/compose';
	import { validate } from '$lib/calc/dependencies';

	let allIds = $derived([...$configurator.selectedServices, ...$configurator.resolvedDependencies]);
	let errors = $derived(validate($configurator));
	let output = $derived(generateAll($configurator));
	let networks = $derived(collectNetworks(generateCompose($configurator)));

	let activeTab = $state<'compose' | 'env' | 'setup' | 'caddyfile' | 'readme'>('compose');
	let copyStatus = $state('');

	// Resource totals
	let totalRAM = $derived.by(() => {
		let ram = 0;
		for (const id of allIds) {
			const svc = findService(id);
			if (svc) ram += svc.resourceEstimate.ramMB;
		}
		return ram;
	});

	function getFileContent(): string {
		switch (activeTab) {
			case 'compose': return output.composeYaml;
			case 'env': return output.envFile;
			case 'setup': return output.setupScript;
			case 'caddyfile': return output.caddyfile || '';
			case 'readme': return output.readme;
		}
	}

	function getFileName(): string {
		switch (activeTab) {
			case 'compose': return 'docker-compose.yml';
			case 'env': return '.env';
			case 'setup': return 'setup.sh';
			case 'caddyfile': return 'Caddyfile';
			case 'readme': return 'README.md';
		}
	}

	async function copyToClipboard() {
		await navigator.clipboard.writeText(getFileContent());
		copyStatus = 'Copied!';
		setTimeout(() => (copyStatus = ''), 2000);
	}

	function downloadFile() {
		const blob = new Blob([getFileContent()], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = getFileName();
		a.click();
		URL.revokeObjectURL(url);
	}

	function downloadAll() {
		// Download each file
		const files = [
			{ name: 'docker-compose.yml', content: output.composeYaml },
			{ name: '.env', content: output.envFile },
			{ name: 'setup.sh', content: output.setupScript },
			{ name: 'README.md', content: output.readme }
		];
		if (output.caddyfile) {
			files.push({ name: 'Caddyfile', content: output.caddyfile });
		}
		for (const file of files) {
			const blob = new Blob([file.content], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = file.name;
			a.click();
			URL.revokeObjectURL(url);
		}
	}

	const tabs = $derived.by(() => {
		const t: { id: typeof activeTab; label: string }[] = [
			{ id: 'compose', label: 'docker-compose.yml' },
			{ id: 'env', label: '.env' },
			{ id: 'setup', label: 'setup.sh' },
		];
		if (output.caddyfile) {
			t.push({ id: 'caddyfile', label: 'Caddyfile' });
		}
		t.push({ id: 'readme', label: 'README.md' });
		return t;
	});
</script>

<svelte:head>
	<title>Review & Generate — SelfHost Wizard</title>
</svelte:head>

<div>
	<h1 class="mb-2 text-2xl font-bold">Review & Generate</h1>
	<p class="mb-6 text-(--color-text-muted)">
		Review your configuration and download the generated files.
	</p>

	<!-- Validation errors -->
	{#if errors.length > 0}
		<div class="mb-6 rounded-xl border border-(--color-danger)/30 bg-(--color-danger)/5 p-4">
			<h2 class="mb-2 text-sm font-semibold text-(--color-danger)">Issues to resolve</h2>
			{#each errors as error}
				<p class="text-sm">{error.message}</p>
			{/each}
		</div>
	{/if}

	<!-- Summary -->
	<div class="mb-6 grid gap-4 sm:grid-cols-3">
		<div class="rounded-xl border border-(--color-border) p-4 text-center">
			<div class="text-2xl font-bold text-(--color-primary)">{allIds.length}</div>
			<div class="text-sm text-(--color-text-muted)">Services</div>
		</div>
		<div class="rounded-xl border border-(--color-border) p-4 text-center">
			<div class="text-2xl font-bold text-(--color-primary)">
				{totalRAM >= 1024 ? `${(totalRAM / 1024).toFixed(1)} GB` : `${totalRAM} MB`}
			</div>
			<div class="text-sm text-(--color-text-muted)">Estimated RAM</div>
		</div>
		<div class="rounded-xl border border-(--color-border) p-4 text-center">
			<div class="text-2xl font-bold text-(--color-primary)">{networks.length}</div>
			<div class="text-sm text-(--color-text-muted)">Networks</div>
		</div>
	</div>

	<!-- Service list -->
	<div class="mb-6 rounded-xl border border-(--color-border) p-4">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Services & Ports</h2>
		<div class="space-y-1">
			{#each allIds as id}
				{@const svc = findService(id)}
				{#if svc}
					<div class="flex items-center justify-between text-sm">
						<span>{svc.name}</span>
						<span class="font-mono text-xs text-(--color-text-muted)">
							{#if svc.ports.length > 0}
								{svc.ports.map((p) => `:${p.host}`).join(', ')}
							{:else}
								—
							{/if}
						</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- File tabs -->
	<div class="mb-6 rounded-xl border border-(--color-border)">
		<div class="flex border-b border-(--color-border) overflow-x-auto">
			{#each tabs as tab}
				<button
					onclick={() => (activeTab = tab.id)}
					class="cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors
						{activeTab === tab.id
							? 'border-b-2 border-(--color-primary) font-medium text-(--color-primary)'
							: 'text-(--color-text-muted) hover:text-(--color-text)'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- File actions -->
		<div class="flex items-center justify-end gap-2 border-b border-(--color-border) px-4 py-2">
			<button
				onclick={copyToClipboard}
				class="cursor-pointer rounded border border-(--color-border) px-3 py-1 text-xs transition-colors hover:bg-(--color-surface-alt)"
			>
				{copyStatus || 'Copy'}
			</button>
			<button
				onclick={downloadFile}
				class="cursor-pointer rounded border border-(--color-border) px-3 py-1 text-xs transition-colors hover:bg-(--color-surface-alt)"
			>
				Download
			</button>
		</div>

		<!-- File content -->
		<pre class="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed">{getFileContent()}</pre>
	</div>

	<!-- Download all -->
	<div class="flex items-center justify-center gap-4">
		<button
			onclick={downloadAll}
			class="cursor-pointer rounded-xl bg-(--color-primary) px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-primary-hover)"
		>
			Download All Files
		</button>
	</div>
</div>
