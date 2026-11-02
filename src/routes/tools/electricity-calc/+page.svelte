<script lang="ts">
	import { resolve } from '$app/paths';
	import { CURRENCY_SYMBOLS, LOCATIONS, type Currency } from '$lib/types/assessment';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import SliderInput from '$lib/components/wizard/SliderInput.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';

	let wattage = $state(50);
	let electricityRate = $state(0.16);
	let currency: Currency = $state('USD');
	let symbol = $derived(CURRENCY_SYMBOLS[currency]);
	let hoursPerDay = $state(24);

	let monthlyKWh = $derived((wattage * hoursPerDay * 30.44) / 1000);
	let monthlyCost = $derived(monthlyKWh * electricityRate);
	let yearlyCost = $derived(monthlyCost * 12);

	function setLocation(key: string) {
		const loc = LOCATIONS[key];
		if (loc) {
			electricityRate = loc.defaultElectricityRate;
			currency = loc.currency;
		}
	}
</script>

<svelte:head>
	<title>Electricity Calculator — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href={resolve('/tools')} class="mb-4 inline-block text-sm text-(--color-primary) hover:underline">&larr; All Tools</a>
	<h1 class="mb-2 text-2xl font-bold">Electricity Cost Calculator</h1>
	<p class="mb-6 text-(--color-text-muted)">How much will it cost to run your server?</p>

	<div class="mb-6 rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/5 p-4 text-center">
		<div class="text-sm text-(--color-text-muted)">Estimated monthly electricity cost</div>
		<div class="text-2xl font-bold text-(--color-primary)">{symbol}{monthlyCost.toFixed(2)}/mo</div>
		<div class="text-sm text-(--color-text-muted)">{symbol}{yearlyCost.toFixed(0)}/yr &middot; {monthlyKWh.toFixed(1)} kWh/mo</div>
	</div>

	<div class="space-y-6">
		<div>
			<label for="wattage" class="mb-1 block text-sm font-medium">Server wattage</label>
			<NumberInput id="wattage" bind:value={wattage} min={5} max={2000} step={5} suffix="W" />
			<div class="mt-2 flex flex-wrap gap-2 text-xs">
				{#each [{ label: 'Raspberry Pi', w: 5 }, { label: 'Mini PC', w: 15 }, { label: 'Laptop', w: 30 }, { label: 'NAS (4-bay)', w: 40 }, { label: 'Desktop', w: 80 }, { label: 'Server', w: 150 }] as preset}
					<button onclick={() => (wattage = preset.w)} class="cursor-pointer rounded-full border border-(--color-border) px-2 py-0.5 hover:border-(--color-primary)">{preset.label} ({preset.w}W)</button>
				{/each}
			</div>
		</div>

		<div>
			<span class="mb-1 block text-sm font-medium">Hours per day</span>
			<SliderInput bind:value={hoursPerDay} min={1} max={24} step={1} suffix="hrs" />
		</div>

		<div>
			<span class="mb-2 block text-sm font-medium">Location (sets electricity rate)</span>
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{#each Object.entries(LOCATIONS).slice(0, 9) as [key, loc]}
					<button onclick={() => setLocation(key)} class="cursor-pointer rounded border border-(--color-border) px-2 py-1.5 text-left text-xs hover:border-(--color-primary)">{loc.label}</button>
				{/each}
			</div>
		</div>

		<div>
			<span class="mb-1 block text-sm font-medium">Electricity rate</span>
			<SliderInput bind:value={electricityRate} min={0.05} max={0.60} step={0.01} suffix="/kWh" />
		</div>
	</div>
</div>
