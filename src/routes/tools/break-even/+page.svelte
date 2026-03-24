<script lang="ts">
	import { CURRENCY_SYMBOLS, type Currency } from '$lib/types/assessment';
	import { FACTORY_DEFAULTS } from '$lib/types/defaults';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import LineChart from '$lib/components/results/LineChart.svelte';

	let currency: Currency = $state('USD');
	let symbol = $derived(CURRENCY_SYMBOLS[currency]);

	let monthlySaasCost = $state(50);
	let monthlySelfHostedCost = $state(8);
	let upfrontCost = $state(500);
	let annualDriveReplacement = $state(15);

	let monthlySavings = $derived(monthlySaasCost - monthlySelfHostedCost);
	let simpleMonths = $derived(monthlySavings > 0 ? Math.ceil(upfrontCost / monthlySavings) : null);
	let adjustedSavings = $derived(monthlySavings - annualDriveReplacement / 12);
	let riskAdjustedMonths = $derived(adjustedSavings > 0 ? Math.ceil(upfrontCost / adjustedSavings) : null);

	let cumulativeCosts = $derived.by(() => {
		const months = FACTORY_DEFAULTS.tcoProjectionYears * 12;
		const data: { month: number; saas: number; selfHosted: number }[] = [];
		let saas = 0;
		let self = upfrontCost;
		for (let m = 0; m <= months; m++) {
			data.push({ month: m, saas: Math.round(saas), selfHosted: Math.round(self) });
			saas += monthlySaasCost;
			self += monthlySelfHostedCost + annualDriveReplacement / 12;
		}
		return data;
	});

	let fiveYearSavings = $derived(
		cumulativeCosts[cumulativeCosts.length - 1].saas - cumulativeCosts[cumulativeCosts.length - 1].selfHosted
	);
</script>

<svelte:head>
	<title>Break-Even Calculator — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href="/tools" class="mb-4 inline-block text-sm text-(--color-primary) hover:underline">&larr; All Tools</a>
	<h1 class="mb-2 text-2xl font-bold">Break-Even Calculator</h1>
	<p class="mb-6 text-(--color-text-muted)">When does self-hosting pay for itself?</p>

	<div class="mb-6 grid grid-cols-3 gap-4 text-center">
		<div class="rounded-lg border border-(--color-border) p-3">
			<div class="text-xs text-(--color-text-muted)">Break-even</div>
			<div class="text-lg font-bold">{simpleMonths ? `${simpleMonths} mo` : 'Never'}</div>
		</div>
		<div class="rounded-lg border border-(--color-border) p-3">
			<div class="text-xs text-(--color-text-muted)">Risk-adjusted</div>
			<div class="text-lg font-bold">{riskAdjustedMonths ? `${riskAdjustedMonths} mo` : 'Never'}</div>
		</div>
		<div class="rounded-lg border border-(--color-border) p-3">
			<div class="text-xs text-(--color-text-muted)">5-year savings</div>
			<div class="text-lg font-bold" class:text-green-500={fiveYearSavings > 0} class:text-red-500={fiveYearSavings < 0}>
				{symbol}{Math.round(fiveYearSavings)}
			</div>
		</div>
	</div>

	<div class="mb-6">
		<LineChart data={cumulativeCosts} formatValue={(v) => `${symbol}${Math.round(v)}`} />
	</div>

	<div class="space-y-4">
		<div>
			<label for="saasCost" class="mb-1 block text-sm font-medium">Monthly SaaS cost</label>
			<NumberInput id="saasCost" bind:value={monthlySaasCost} min={0} max={500} step={5} suffix="/mo" />
		</div>
		<div>
			<label for="selfHostedCost" class="mb-1 block text-sm font-medium">Monthly self-hosted cost (electricity + services)</label>
			<NumberInput id="selfHostedCost" bind:value={monthlySelfHostedCost} min={0} max={200} step={1} suffix="/mo" />
		</div>
		<div>
			<label for="upfront" class="mb-1 block text-sm font-medium">Upfront hardware cost</label>
			<NumberInput id="upfront" bind:value={upfrontCost} min={0} max={10000} step={50} suffix="" />
		</div>
		<div>
			<label for="driveReplace" class="mb-1 block text-sm font-medium">Annual drive replacement budget</label>
			<NumberInput id="driveReplace" bind:value={annualDriveReplacement} min={0} max={500} step={5} suffix="/yr" />
		</div>
	</div>
</div>
