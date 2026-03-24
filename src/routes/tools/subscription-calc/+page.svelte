<script lang="ts">
	import {
		STREAMING_SERVICES,
		MUSIC_SERVICES,
		CLOUD_STORAGE_SERVICES,
		CURRENCY_SYMBOLS,
		type Currency
	} from '$lib/types/assessment';

	let currency: Currency = $state('USD');
	let symbol = $derived(CURRENCY_SYMBOLS[currency]);

	let streaming = $state(STREAMING_SERVICES.map((s) => ({ ...s, enabled: false })));
	let music = $state(MUSIC_SERVICES.map((s) => ({ ...s, enabled: false })));
	let cloud = $state(CLOUD_STORAGE_SERVICES.map((s) => ({ ...s, enabled: false })));
	let custom: { name: string; cost: number }[] = $state([]);

	let total = $derived(
		[...streaming, ...music, ...cloud].filter((s) => s.enabled).reduce((sum, s) => sum + s.monthlyCost, 0) +
		custom.reduce((sum, s) => sum + s.cost, 0)
	);

	function addCustom() {
		custom = [...custom, { name: '', cost: 0 }];
	}

	function removeCustom(i: number) {
		custom = custom.filter((_, idx) => idx !== i);
	}
</script>

<svelte:head>
	<title>Subscription Calculator — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href="/tools" class="mb-4 inline-block text-sm text-(--color-primary) hover:underline">&larr; All Tools</a>
	<h1 class="mb-2 text-2xl font-bold">Subscription Calculator</h1>
	<p class="mb-6 text-(--color-text-muted)">How much are you spending on cloud services each month?</p>

	<div class="sticky top-4 z-10 mb-6 rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/5 p-3 text-center">
		<span class="text-sm text-(--color-text-muted)">Monthly total:</span>
		<span class="ml-2 text-xl font-bold text-(--color-primary)">{symbol}{total.toFixed(2)}/mo</span>
		<span class="ml-1 text-sm text-(--color-text-muted)">({symbol}{(total * 12).toFixed(0)}/yr)</span>
	</div>

	<h3 class="mb-2 font-semibold">Streaming Video</h3>
	<div class="mb-6 space-y-1">
		{#each streaming as svc, i}
			<label class="flex items-center justify-between rounded p-2 hover:bg-(--color-surface-alt)">
				<span class="flex items-center gap-2">
					<input type="checkbox" bind:checked={streaming[i].enabled} class="accent-(--color-primary)" />
					{svc.name}
				</span>
				<span class="text-sm text-(--color-text-muted)">{symbol}{svc.monthlyCost}/mo</span>
			</label>
		{/each}
	</div>

	<h3 class="mb-2 font-semibold">Music</h3>
	<div class="mb-6 space-y-1">
		{#each music as svc, i}
			<label class="flex items-center justify-between rounded p-2 hover:bg-(--color-surface-alt)">
				<span class="flex items-center gap-2">
					<input type="checkbox" bind:checked={music[i].enabled} class="accent-(--color-primary)" />
					{svc.name}
				</span>
				<span class="text-sm text-(--color-text-muted)">{symbol}{svc.monthlyCost}/mo</span>
			</label>
		{/each}
	</div>

	<h3 class="mb-2 font-semibold">Cloud Storage</h3>
	<div class="mb-6 space-y-1">
		{#each cloud as svc, i}
			<label class="flex items-center justify-between rounded p-2 hover:bg-(--color-surface-alt)">
				<span class="flex items-center gap-2">
					<input type="checkbox" bind:checked={cloud[i].enabled} class="accent-(--color-primary)" />
					{svc.name}
				</span>
				<span class="text-sm text-(--color-text-muted)">{symbol}{svc.monthlyCost}/mo</span>
			</label>
		{/each}
	</div>

	<h3 class="mb-2 font-semibold">Other Services</h3>
	<div class="mb-6 space-y-2">
		{#each custom as svc, i}
			<div class="flex items-center gap-2">
				<input type="text" bind:value={custom[i].name} placeholder="Service" class="h-8 flex-1 rounded border border-(--color-border) bg-(--color-surface) px-3 text-sm" />
				<div class="relative flex items-center">
					<span class="absolute left-2 text-xs text-(--color-text-muted)">{symbol}</span>
					<input type="number" min="0" step="0.01" bind:value={custom[i].cost} class="h-8 w-24 rounded border border-(--color-border) bg-(--color-surface) pl-6 pr-1 text-right text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
				</div>
				<button onclick={() => removeCustom(i)} class="cursor-pointer text-sm text-(--color-danger) hover:underline">Remove</button>
			</div>
		{/each}
		<button onclick={addCustom} class="cursor-pointer rounded border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) hover:border-(--color-primary) hover:text-(--color-primary)">+ Add service</button>
	</div>
</div>
