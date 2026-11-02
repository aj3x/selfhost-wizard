<script lang="ts">
	import { resolve } from '$app/paths';
	import { FACTORY_DEFAULTS } from '$lib/types/defaults';
	import { CURRENCY_SYMBOLS, type Currency } from '$lib/types/assessment';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';

	let currency: Currency = $state('USD');
	let symbol = $derived(CURRENCY_SYMBOLS[currency]);
	let driveCount = $state(2);
	let driveSizeGB = $state(4000);
	let ageYears = $state(2);
	let isNASRated = $state(false);

	const d = FACTORY_DEFAULTS;
	let baseAFR = $derived(isNASRated ? d.nasDriveAfr : d.hddAfr);
	let warrantyYears = $derived(isNASRated ? d.nasWarrantyYears : d.consumerWarrantyYears);
	let ageMultiplier = $derived(1 + Math.max(0, ageYears - warrantyYears) * 0.02);
	let adjustedAFR = $derived(baseAFR * ageMultiplier);

	let annualAnyFail = $derived(1 - Math.pow(1 - adjustedAFR, driveCount));
	let fiveYearAnyFail = $derived(1 - Math.pow(1 - annualAnyFail, 5));
	let replacementCost = $derived((driveSizeGB / 1000) * d.hddPricePerTB);
	let annualizedReplacement = $derived(annualAnyFail * replacementCost * driveCount);

	let riskLevel = $derived(
		fiveYearAnyFail < 0.1 ? 'low' : fiveYearAnyFail < 0.3 ? 'medium' : fiveYearAnyFail < 0.6 ? 'high' : 'very_high'
	);

	const RISK_COLORS: Record<string, string> = {
		low: '#22c55e',
		medium: '#f59e0b',
		high: '#ef4444',
		very_high: '#991b1b'
	};
</script>

<svelte:head>
	<title>Drive Failure Calculator — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href={resolve('/tools')} class="mb-4 inline-block text-sm text-(--color-primary) hover:underline">&larr; All Tools</a>
	<h1 class="mb-2 text-2xl font-bold">Drive Failure Risk Calculator</h1>
	<p class="mb-6 text-(--color-text-muted)">What's the chance of losing a drive, and what will it cost?</p>

	<div class="mb-6 flex items-center gap-4">
		<div
			class="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
			style="background-color: {RISK_COLORS[riskLevel]}"
		>
			{riskLevel.replace('_', ' ').toUpperCase()} RISK
		</div>
	</div>

	<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
		<div class="rounded-lg border border-(--color-border) p-3 text-center">
			<div class="text-xs text-(--color-text-muted)">Annual failure (any)</div>
			<div class="text-lg font-bold">{(annualAnyFail * 100).toFixed(1)}%</div>
		</div>
		<div class="rounded-lg border border-(--color-border) p-3 text-center">
			<div class="text-xs text-(--color-text-muted)">5-year failure</div>
			<div class="text-lg font-bold">{(fiveYearAnyFail * 100).toFixed(1)}%</div>
		</div>
		<div class="rounded-lg border border-(--color-border) p-3 text-center">
			<div class="text-xs text-(--color-text-muted)">Replacement cost</div>
			<div class="text-lg font-bold">{symbol}{Math.round(replacementCost)}</div>
		</div>
		<div class="rounded-lg border border-(--color-border) p-3 text-center">
			<div class="text-xs text-(--color-text-muted)">Annual budget</div>
			<div class="text-lg font-bold">{symbol}{annualizedReplacement.toFixed(2)}/yr</div>
		</div>
	</div>

	<div class="space-y-4">
		<div>
			<label for="driveCount" class="mb-1 block text-sm font-medium">Number of drives</label>
			<NumberInput id="driveCount" bind:value={driveCount} min={1} max={24} step={1} />
		</div>
		<div>
			<label for="driveSize" class="mb-1 block text-sm font-medium">Drive size</label>
			<NumberInput id="driveSize" bind:value={driveSizeGB} min={500} max={24000} step={500} suffix="GB" />
		</div>
		<div>
			<label for="driveAge" class="mb-1 block text-sm font-medium">Average age</label>
			<NumberInput id="driveAge" bind:value={ageYears} min={0} max={15} step={1} suffix="years" />
		</div>
		<div>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={isNASRated} class="accent-(--color-primary)" />
				NAS-rated drives (lower failure rate)
			</label>
		</div>

		<div class="rounded-lg bg-(--color-surface-alt) p-3 text-sm">
			<div class="flex justify-between"><span>Base AFR:</span><span>{(baseAFR * 100).toFixed(2)}%</span></div>
			<div class="flex justify-between"><span>Age multiplier:</span><span>{ageMultiplier.toFixed(2)}x</span></div>
			<div class="flex justify-between"><span>Adjusted AFR per drive:</span><span>{(adjustedAFR * 100).toFixed(2)}%</span></div>
		</div>
	</div>
</div>
