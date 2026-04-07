<script lang="ts">
	import { configurator } from '$lib/stores/configurator';
	import { assessment } from '$lib/stores/assessment';
	import { getServicesByCategory } from '$lib/services/registry';
	import type { Preset } from '$lib/types/configurator';
	import ServiceCard from '$lib/components/configurator/ServiceCard.svelte';
	import PresetBar from '$lib/components/configurator/PresetBar.svelte';

	const categories = getServicesByCategory();

	let selectedSet = $derived(new Set([...$configurator.selectedServices, ...$configurator.resolvedDependencies]));
	let totalSelected = $derived(selectedSet.size);
	let skillLevel = $derived($assessment.skillLevel);
	let skillOrder = { beginner: 0, intermediate: 1, advanced: 2 } as const;

	function toggleService(id: string) {
		configurator.toggleService(id);
	}

	function applyPreset(preset: Preset) {
		configurator.applyPreset(preset.id, preset.serviceIds);
	}

	// Compute total resource estimates
	let totalRAM = $derived.by(() => {
		let ram = 0;
		for (const cat of categories) {
			for (const svc of cat.services) {
				if (selectedSet.has(svc.id)) {
					ram += svc.resourceEstimate.ramMB;
				}
			}
		}
		return ram;
	});

	let totalStorage = $derived.by(() => {
		let storage = 0;
		for (const cat of categories) {
			for (const svc of cat.services) {
				if (selectedSet.has(svc.id)) {
					storage += svc.resourceEstimate.storageGB;
				}
			}
		}
		return storage;
	});
</script>

<svelte:head>
	<title>Select Services — SelfHost Wizard</title>
</svelte:head>

<div>
	<h1 class="mb-2 text-2xl font-bold">Choose Your Services</h1>
	<p class="mb-6 text-(--color-text-muted)">
		Select the services you want to run. Don't worry about dependencies — we'll sort those out next.
	</p>

	<PresetBar {skillLevel} activePreset={$configurator.activePreset} onApply={applyPreset} />

	{#if totalSelected > 0}
		<div class="mb-6 flex items-center gap-4 rounded-lg bg-(--color-surface-alt) px-4 py-2 text-sm" role="status" aria-live="polite">
			<span><strong>{totalSelected}</strong> services selected</span>
			<span class="text-(--color-text-muted)" aria-hidden="true">|</span>
			<span>~{totalRAM >= 1024 ? `${(totalRAM / 1024).toFixed(1)} GB` : `${totalRAM} MB`} RAM</span>
			<span class="text-(--color-text-muted)" aria-hidden="true">|</span>
			<span>~{totalStorage.toFixed(1)} GB config storage</span>
		</div>
	{/if}

	{#each categories as group}
		<section aria-label={group.label}>
			<h2 class="section-heading">
				{group.label}
			</h2>
			<div class="grid gap-2 sm:grid-cols-2">
				{#each group.services as service}
					<ServiceCard
						{service}
						selected={selectedSet.has(service.id)}
						onToggle={toggleService}
					/>
				{/each}
			</div>
		</section>
	{/each}
</div>
