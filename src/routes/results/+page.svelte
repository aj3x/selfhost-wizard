<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { defaults } from '$lib/stores/defaults';
	import { CURRENCY_SYMBOLS } from '$lib/types/assessment';
	import { estimateStorage } from '$lib/calc/storage';
	import { calcElectricityCost, estimateWattage } from '$lib/calc/electricity';
	import { estimateHardwareCost } from '$lib/calc/hardware';
	import { analyzeRisk } from '$lib/calc/risk';
	import { calcBreakEven } from '$lib/calc/breakeven';
	import { calcMonthlySaasCost, calcMonthlySelfHostedCost } from '$lib/calc/saas';
	import { generateRecommendation } from '$lib/calc/recommendation';
	import BarChart from '$lib/components/results/BarChart.svelte';
	import LineChart from '$lib/components/results/LineChart.svelte';

	let symbol = $derived(CURRENCY_SYMBOLS[$assessment.currency]);

	let storage = $derived(estimateStorage($assessment, $defaults));
	let electricityCost = $derived(calcElectricityCost($assessment, $defaults));
	let hardware = $derived(estimateHardwareCost($assessment, $defaults, storage));
	let risk = $derived(analyzeRisk($assessment, $defaults, storage.withHeadroomGB));
	let monthlySaas = $derived(calcMonthlySaasCost($assessment));
	let monthlySelfHosted = $derived(calcMonthlySelfHostedCost($assessment, electricityCost, $defaults));
	let breakEven = $derived(
		calcBreakEven(monthlySaas, monthlySelfHosted, hardware.total, risk.annualizedReplacementCost, $defaults)
	);
	let recommendation = $derived(generateRecommendation($assessment, monthlySaas, breakEven));
	let wattage = $derived(estimateWattage($assessment, $defaults));

	const RISK_COLORS = {
		low: '#22c55e',
		medium: '#f59e0b',
		high: '#ef4444',
		very_high: '#991b1b'
	};

	const TIER_COLORS: Record<string, string> = {
		stick_with_saas: '#64748b',
		managed_nas: '#3b82f6',
		diy_simple: '#22c55e',
		diy_full: '#6366f1',
		cloud_hosted: '#f59e0b'
	};

	function fmt(v: number): string {
		return `${symbol}${v.toFixed(2)}`;
	}

	function fmtRound(v: number): string {
		return `${symbol}${Math.round(v)}`;
	}
</script>

<svelte:head>
	<title>Your Self-Hosting Assessment Results</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-2 text-2xl font-bold">Your Results</h1>
	<p class="mb-8 text-(--color-text-muted)">
		Here's your personalized self-hosting cost/benefit analysis.
	</p>

	<!-- Recommendation Card -->
	<div
		class="mb-8 rounded-xl border-2 p-6"
		style="border-color: {TIER_COLORS[recommendation.tier]}"
	>
		<div class="mb-1 text-sm font-medium uppercase tracking-wide" style="color: {TIER_COLORS[recommendation.tier]}">
			Recommendation
		</div>
		<h2 class="mb-2 text-xl font-bold">{recommendation.title}</h2>
		<p class="mb-4 text-(--color-text-muted)">{recommendation.summary}</p>
		<ul class="space-y-1">
			{#each recommendation.reasons as reason}
				<li class="text-sm text-(--color-text-muted)">• {reason}</li>
			{/each}
		</ul>
	</div>

	<!-- Monthly Cost Comparison -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-4 text-lg font-semibold">Monthly Cost Comparison</h3>
		<BarChart
			data={[
				{ label: 'Current SaaS', value: monthlySaas, color: '#ef4444' },
				{ label: 'Self-Hosted', value: monthlySelfHosted, color: '#22c55e' }
			]}
			formatValue={(v) => fmt(v)}
		/>
		<div class="mt-4 grid grid-cols-2 gap-4 text-sm">
			<div>
				<div class="text-(--color-text-muted)">Current monthly</div>
				<div class="text-lg font-bold text-red-500">{fmt(monthlySaas)}/mo</div>
				<div class="text-(--color-text-muted)">{fmtRound(monthlySaas * 12)}/yr</div>
			</div>
			<div>
				<div class="text-(--color-text-muted)">Self-hosted monthly</div>
				<div class="text-lg font-bold text-green-500">{fmt(monthlySelfHosted)}/mo</div>
				<div class="text-xs text-(--color-text-muted)">
					Electricity ({wattage}W): {fmt(electricityCost)}
					{#if monthlySelfHosted > electricityCost}
						+ services: {fmt(monthlySelfHosted - electricityCost)}
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Break-Even Timeline -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-4 text-lg font-semibold">Break-Even Timeline</h3>
		<LineChart data={breakEven.cumulativeCosts} formatValue={(v) => fmtRound(v)} />
		<div class="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
			<div>
				<div class="text-(--color-text-muted)">Simple break-even</div>
				<div class="text-lg font-bold">
					{breakEven.simpleMonths ? `${breakEven.simpleMonths} mo` : 'N/A'}
				</div>
			</div>
			<div>
				<div class="text-(--color-text-muted)">Risk-adjusted</div>
				<div class="text-lg font-bold">
					{breakEven.riskAdjustedMonths ? `${breakEven.riskAdjustedMonths} mo` : 'N/A'}
				</div>
			</div>
			<div>
				<div class="text-(--color-text-muted)">5-year savings</div>
				<div class="text-lg font-bold" class:text-green-500={breakEven.fiveYearSavings > 0} class:text-red-500={breakEven.fiveYearSavings < 0}>
					{fmtRound(breakEven.fiveYearSavings)}
				</div>
			</div>
		</div>
	</div>

	<!-- Upfront Costs -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-4 text-lg font-semibold">Upfront Investment</h3>
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-sm">{hardware.deviceLabel}</span>
				<span class="font-medium">{fmtRound(hardware.device)}</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm">Storage (HDDs/SSDs)</span>
				<span class="font-medium">{fmtRound(hardware.storage)}</span>
			</div>
			{#if hardware.accessories > 0}
				<div class="flex items-center justify-between">
					<span class="text-sm">Accessories (UPS, domain, etc.)</span>
					<span class="font-medium">{fmtRound(hardware.accessories)}</span>
				</div>
			{/if}
			<div class="flex items-center justify-between border-t border-(--color-border) pt-3">
				<span class="font-semibold">Total upfront</span>
				<span class="text-lg font-bold">{fmtRound(hardware.total)}</span>
			</div>
		</div>
	</div>

	<!-- Storage Estimate -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-4 text-lg font-semibold">Storage Estimate</h3>
		<div class="space-y-2">
			{#if storage.mediaGB > 0}
				<div class="flex justify-between text-sm">
					<span>Media (movies + TV)</span>
					<span>{(storage.mediaGB / 1000).toFixed(1)} TB</span>
				</div>
			{/if}
			{#if storage.musicGB > 0}
				<div class="flex justify-between text-sm">
					<span>Music</span>
					<span>{storage.musicGB >= 1000 ? `${(storage.musicGB / 1000).toFixed(1)} TB` : `${Math.round(storage.musicGB)} GB`}</span>
				</div>
			{/if}
			{#if storage.photosGB > 0}
				<div class="flex justify-between text-sm">
					<span>Photos ({$defaults.growthProjectionYears}yr projected)</span>
					<span>{storage.photosGB >= 1000 ? `${(storage.photosGB / 1000).toFixed(1)} TB` : `${Math.round(storage.photosGB)} GB`}</span>
				</div>
			{/if}
			{#if storage.filesGB > 0}
				<div class="flex justify-between text-sm">
					<span>Files & backups</span>
					<span>{storage.filesGB >= 1000 ? `${(storage.filesGB / 1000).toFixed(1)} TB` : `${Math.round(storage.filesGB)} GB`}</span>
				</div>
			{/if}
			<div class="flex justify-between text-sm text-(--color-text-muted)">
				<span>System overhead</span>
				<span>{storage.systemGB} GB</span>
			</div>
			<div class="flex items-center justify-between border-t border-(--color-border) pt-3">
				<span class="font-semibold">Total (with 15% headroom)</span>
				<span class="text-lg font-bold">{(storage.withHeadroomGB / 1000).toFixed(1)} TB</span>
			</div>
		</div>
	</div>

	<!-- Risk Analysis -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-4 text-lg font-semibold">Risk Analysis</h3>
		{#if risk.totalDrives > 0}
			<div class="mb-4 flex items-center gap-3">
				<div
					class="rounded-full px-3 py-1 text-sm font-medium text-white"
					style="background-color: {RISK_COLORS[risk.riskLevel]}"
				>
					{risk.riskLevel.replace('_', ' ').toUpperCase()} RISK
				</div>
				<span class="text-sm text-(--color-text-muted)">{risk.totalDrives} drive(s)</span>
			</div>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span>Annual failure probability (any drive)</span>
					<span>{(risk.annualFailureProbability * 100).toFixed(1)}%</span>
				</div>
				<div class="flex justify-between">
					<span>5-year failure probability</span>
					<span>{(risk.fiveYearFailureProbability * 100).toFixed(1)}%</span>
				</div>
				<div class="flex justify-between">
					<span>Annualized replacement cost</span>
					<span>{fmt(risk.annualizedReplacementCost)}/yr</span>
				</div>
			</div>
		{:else}
			<p class="text-sm text-(--color-text-muted)">
				No storage drives configured — risk analysis requires drive information.
			</p>
		{/if}
	</div>

	<!-- Actions -->
	<div class="flex flex-wrap gap-4">
		<a
			href="/assess/about-you"
			class="rounded-lg border border-(--color-border) px-6 py-3 text-sm font-medium transition-colors hover:bg-(--color-surface-alt)"
		>
			&larr; Edit Answers
		</a>
		<button
			onclick={() => {
				navigator.clipboard.writeText(JSON.stringify($assessment, null, 2));
			}}
			class="cursor-pointer rounded-lg border border-(--color-border) px-6 py-3 text-sm font-medium transition-colors hover:bg-(--color-surface-alt)"
		>
			Copy Results JSON
		</button>
	</div>
</div>
