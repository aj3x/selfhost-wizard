<script lang="ts">
	import { goto } from '$app/navigation';
	import { assessment } from '$lib/stores/assessment';
	import { defaults } from '$lib/stores/defaults';
	import { configurator } from '$lib/stores/configurator';
	import { CURRENCY_SYMBOLS } from '$lib/types/assessment';
	import { estimateStorage } from '$lib/calc/storage';
	import { calcElectricityCost, estimateWattage } from '$lib/calc/electricity';
	import { estimateHardwareCost } from '$lib/calc/hardware';
	import { analyzeRisk } from '$lib/calc/risk';
	import { calcBreakEven } from '$lib/calc/breakeven';
	import { calcMonthlySaasCost, calcMonthlySelfHostedCost } from '$lib/calc/saas';
	import { generateRecommendation } from '$lib/calc/recommendation';
	import { mapAssessmentToConfigurator } from '$lib/calc/bridge';
	import BarChart from '$lib/components/results/BarChart.svelte';
	import LineChart from '$lib/components/results/LineChart.svelte';

	function jumpToConfigurator() {
		const state = mapAssessmentToConfigurator($assessment);
		configurator.set(state);
		goto('/configure/service-select');
	}

	let isBeginner = $derived($assessment.skillLevel === 'beginner');
	let symbol = $derived(CURRENCY_SYMBOLS[$assessment.currency]);

	let storage = $derived(estimateStorage($assessment, $defaults));
	let wattage = $derived(estimateWattage($assessment, $defaults));
	let electricityCost = $derived(calcElectricityCost($assessment, $defaults));
	let hardware = $derived(estimateHardwareCost($assessment, $defaults, storage));
	let risk = $derived(analyzeRisk($assessment, $defaults, storage.withHeadroomGB));
	let monthlySaas = $derived(calcMonthlySaasCost($assessment));
	let monthlySelfHosted = $derived(calcMonthlySelfHostedCost($assessment, electricityCost, $defaults));
	let breakEven = $derived(
		calcBreakEven(monthlySaas, monthlySelfHosted, hardware.total, risk.annualizedReplacementCost, $defaults)
	);
	let recommendation = $derived(generateRecommendation($assessment, monthlySaas, breakEven));

	let monthlySavings = $derived(monthlySaas - monthlySelfHosted);
	let vpnCost = $derived(
		$assessment.vpnService?.enabled ? $assessment.vpnService.monthlyCost : 0
	);
	let domainCost = $derived($assessment.wantsDomain ? 1 : 0); // ~$12/yr
	let offsiteCost = $derived(monthlySelfHosted - electricityCost - vpnCost - domainCost);

	const RISK_COLORS: Record<string, string> = {
		low: '#22c55e',
		medium: '#f59e0b',
		high: '#ef4444',
		very_high: '#991b1b'
	};

	const TIER_LABELS: Record<string, string> = {
		stick_with_saas: 'Stay With SaaS',
		managed_nas: 'Managed NAS',
		diy_simple: 'Simple DIY',
		diy_full: 'Full Stack DIY',
		cloud_hosted: 'Cloud Hosted'
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

	function fmtStorage(gb: number): string {
		if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
		return `${Math.round(gb)} GB`;
	}

	let storageCategories = $derived(
		[
			{ label: 'Media', gb: storage.mediaGB, color: '#6366f1' },
			{ label: 'Music', gb: storage.musicGB, color: '#8b5cf6' },
			{ label: 'Photos', gb: storage.photosGB, color: '#22c55e' },
			{ label: 'Files', gb: storage.filesGB, color: '#3b82f6' },
			{ label: 'System + headroom', gb: storage.systemGB + (storage.withHeadroomGB - storage.rawTotalGB), color: '#94a3b8' }
		].filter(c => c.gb > 0)
	);
</script>

<svelte:head>
	<title>Your Self-Hosting Assessment Results</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-2 text-2xl font-bold">Your Results</h1>
	<p class="mb-8 text-(--color-text-muted)">
		{#if isBeginner}
			Here's what we found based on your answers. Don't worry if the numbers aren't perfect — this is a starting estimate.
		{:else}
			Your personalized self-hosting cost/benefit analysis.
		{/if}
	</p>

	<!-- Recommendation Card -->
	<div
		class="mb-8 rounded-xl border-2 p-6"
		style="border-color: {TIER_COLORS[recommendation.tier]}"
	>
		<div class="mb-1 flex items-center gap-2">
			<span
				class="rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
				style="background-color: {TIER_COLORS[recommendation.tier]}"
			>
				{TIER_LABELS[recommendation.tier]}
			</span>
		</div>
		<h2 class="mb-2 text-xl font-bold">{recommendation.title}</h2>
		<p class="mb-4 text-(--color-text-muted)">{recommendation.summary}</p>
		<ul class="space-y-1">
			{#each recommendation.reasons as reason}
				<li class="text-sm text-(--color-text-muted)">{reason}</li>
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
				<div class="text-(--color-text-muted)">What you pay now</div>
				<div class="text-lg font-bold text-red-500">{fmt(monthlySaas)}/mo</div>
				<div class="text-(--color-text-muted)">{fmtRound(monthlySaas * 12)}/yr</div>
			</div>
			<div>
				<div class="text-(--color-text-muted)">Self-hosted ongoing</div>
				<div class="text-lg font-bold text-green-500">{fmt(monthlySelfHosted)}/mo</div>
				<div class="text-(--color-text-muted)">{fmtRound(monthlySelfHosted * 12)}/yr</div>
			</div>
		</div>

		{#if monthlySavings > 0}
			<div class="mt-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 text-center">
				<span class="text-sm text-(--color-text-muted)">Monthly savings:</span>
				<span class="ml-2 text-lg font-bold text-green-600">{fmt(monthlySavings)}/mo</span>
				<span class="text-sm text-(--color-text-muted)">({fmtRound(monthlySavings * 12)}/yr)</span>
			</div>
		{/if}

		<!-- Ongoing expense breakdown -->
		<div class="mt-4 border-t border-(--color-border) pt-4">
			<h4 class="mb-2 text-sm font-medium text-(--color-text-muted)">Ongoing expense breakdown:</h4>
			<div class="space-y-1 text-sm">
				<div class="flex justify-between">
					<span>Electricity ({wattage}W)</span>
					<span>{fmt(electricityCost)}/mo</span>
				</div>
				{#if vpnCost > 0}
					<div class="flex justify-between">
						<span>VPN service</span>
						<span>{fmt(vpnCost)}/mo</span>
					</div>
				{/if}
				{#if $assessment.wantsDomain}
					<div class="flex justify-between">
						<span>Domain name</span>
						<span>~{fmt(domainCost)}/mo</span>
					</div>
				{/if}
				{#if $assessment.wantsOffsiteBackup === 'cloud'}
					<div class="flex justify-between">
						<span>Cloud backup (off-site)</span>
						<span>{fmt(Math.max(0, offsiteCost))}/mo</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Break-Even Timeline -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-1 text-lg font-semibold">Break-Even Timeline</h3>
		{#if isBeginner}
			<p class="mb-4 text-sm text-(--color-text-muted)">
				This shows when your savings from lower monthly costs will cover the initial hardware purchase.
			</p>
		{/if}
		<LineChart data={breakEven.cumulativeCosts} formatValue={(v) => fmtRound(v)} />
		<div class="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
			<div>
				<div class="text-(--color-text-muted)">{isBeginner ? 'Pays for itself in' : 'Simple break-even'}</div>
				<div class="text-lg font-bold">
					{breakEven.simpleMonths ? `${breakEven.simpleMonths} mo` : 'N/A'}
				</div>
			</div>
			<div>
				<div class="text-(--color-text-muted)">{isBeginner ? 'Including repairs' : 'Risk-adjusted'}</div>
				<div class="text-lg font-bold">
					{breakEven.riskAdjustedMonths ? `${breakEven.riskAdjustedMonths} mo` : 'N/A'}
				</div>
			</div>
			<div>
				<div class="text-(--color-text-muted)">5-year savings</div>
				<div
					class="text-lg font-bold"
					class:text-green-500={breakEven.fiveYearSavings > 0}
					class:text-red-500={breakEven.fiveYearSavings < 0}
				>
					{fmtRound(breakEven.fiveYearSavings)}
				</div>
			</div>
		</div>
	</div>

	<!-- Upfront Costs -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-1 text-lg font-semibold">Upfront Investment</h3>
		{#if isBeginner}
			<p class="mb-4 text-sm text-(--color-text-muted)">
				This is the one-time cost to get started. Using hardware you already own reduces this significantly.
			</p>
		{/if}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-sm">{hardware.deviceLabel}</span>
				<span class="font-medium">{hardware.device > 0 ? fmtRound(hardware.device) : 'Free (BYOD)'}</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm">Storage (HDDs/SSDs)</span>
				<span class="font-medium">{hardware.storage > 0 ? fmtRound(hardware.storage) : 'Existing drives'}</span>
			</div>
			{#if hardware.accessories > 0}
				<div class="flex items-center justify-between">
					<span class="text-sm">
						Accessories
						{#if isBeginner}(UPS, cables, etc.){/if}
					</span>
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
		<h3 class="mb-1 text-lg font-semibold">Storage Estimate</h3>
		{#if isBeginner}
			<p class="mb-4 text-sm text-(--color-text-muted)">
				How much disk space you'll need for everything you want to store.
			</p>
		{/if}

		<!-- Visual bar breakdown -->
		<div class="mb-4 flex h-6 overflow-hidden rounded-full">
			{#each storageCategories as cat}
				{@const pct = (cat.gb / storage.withHeadroomGB) * 100}
				{#if pct > 0}
					<div
						class="flex items-center justify-center text-[10px] font-medium text-white"
						style="width: {pct}%; background-color: {cat.color}; min-width: {pct > 5 ? '0' : '4'}px"
						title="{cat.label}: {fmtStorage(cat.gb)}"
					>
						{#if pct > 10}{cat.label}{/if}
					</div>
				{/if}
			{/each}
		</div>
		<div class="mb-4 flex flex-wrap gap-3 text-xs">
			{#each storageCategories as cat}
				<span class="flex items-center gap-1">
					<span class="inline-block h-2.5 w-2.5 rounded-full" style="background-color: {cat.color}"></span>
					{cat.label}: {fmtStorage(cat.gb)}
				</span>
			{/each}
		</div>

		<div class="flex items-center justify-between border-t border-(--color-border) pt-3">
			<span class="font-semibold">Total needed</span>
			<span class="text-lg font-bold">{fmtStorage(storage.withHeadroomGB)}</span>
		</div>
		{#if isBeginner}
			<p class="mt-2 text-xs text-(--color-text-muted)">
				Includes 15% headroom for growth. Remember: buy one size up from what you think you'll need.
			</p>
		{/if}
	</div>

	<!-- Risk Analysis -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h3 class="mb-1 text-lg font-semibold">Risk Analysis</h3>
		{#if isBeginner}
			<p class="mb-4 text-sm text-(--color-text-muted)">
				Hard drives fail eventually. Here's the likelihood and estimated cost.
			</p>
		{/if}
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
					<span>{isBeginner ? 'Chance of a drive failing this year' : 'Annual failure probability (any drive)'}</span>
					<span class="font-medium">{(risk.annualFailureProbability * 100).toFixed(1)}%</span>
				</div>
				<div class="flex justify-between">
					<span>{isBeginner ? 'Chance of failure within 5 years' : '5-year failure probability'}</span>
					<span class="font-medium">{(risk.fiveYearFailureProbability * 100).toFixed(1)}%</span>
				</div>
				<div class="flex justify-between">
					<span>{isBeginner ? 'Set aside for replacements' : 'Annualized replacement cost'}</span>
					<span class="font-medium">{fmt(risk.annualizedReplacementCost)}/yr</span>
				</div>
			</div>
			{#if isBeginner && risk.riskLevel !== 'low'}
				<p class="mt-3 text-sm text-(--color-text-muted)">
					This is why backups matter! With RAID, a single drive failure won't lose your data.
					But remember — RAID is not a backup. Keep important files in at least two places.
				</p>
			{/if}
		{:else}
			<p class="text-sm text-(--color-text-muted)">
				No storage drives configured — risk analysis will update once you add drive information on the Hardware page.
			</p>
		{/if}
	</div>

	<!-- Recommended OS -->
	{#if recommendation.tier !== 'stick_with_saas' && recommendation.tier !== 'managed_nas'}
		<div class="mb-8 rounded-xl border border-(--color-border) p-6">
			<h3 class="mb-1 text-lg font-semibold">Recommended Operating System</h3>
			{#if isBeginner}
				<p class="mb-4 text-sm text-(--color-text-muted)">
					Your server needs a base operating system to run Docker containers on. Here are the best options.
				</p>
			{/if}
			<div class="space-y-3">
				<div class="rounded-lg border border-(--color-border) p-4">
					<div class="flex items-center gap-2">
						<span class="font-medium">Ubuntu Server LTS</span>
						<span class="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">Recommended</span>
					</div>
					<p class="mt-1 text-sm text-(--color-text-muted)">
						The most popular choice for Docker-based self-hosting. Lightweight, well-documented, and supported by virtually every guide and tutorial online. Minimal resource overhead — almost all your RAM and CPU go to your services.
					</p>
				</div>
				<div class="rounded-lg border border-(--color-border) p-4">
					<div class="flex items-center gap-2">
						<span class="font-medium">TrueNAS SCALE</span>
					</div>
					<p class="mt-1 text-sm text-(--color-text-muted)">
						A full NAS operating system with a web UI, built-in ZFS storage management, and Docker app support.
						Great if you want a GUI for storage management, but requires significantly more resources
						(16+ GB RAM recommended) and can be more restrictive for custom Docker Compose setups.
					</p>
				</div>
			</div>
		</div>
	{/if}

	{@const minUploadForStreaming = Math.max(10, $assessment.concurrentStreams * 8)}
	{@const maxRemoteStreams = Math.floor($assessment.uploadSpeed / 5)}
	{#if $assessment.uploadSpeed < minUploadForStreaming && ($assessment.remoteAccess === 'regular' || $assessment.remoteAccess === 'share')}
		<div class="mb-8 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-6">
			<h3 class="mb-2 text-lg font-semibold">Bandwidth Warning</h3>
			<p class="text-sm text-(--color-text-muted)">
				Your upload speed ({$assessment.uploadSpeed} Mbps) may struggle with {$assessment.concurrentStreams} concurrent remote stream{$assessment.concurrentStreams > 1 ? 's' : ''}.
				{#if isBeginner}
					This means watching media from outside your home could buffer or have poor quality.
					You'd want at least {minUploadForStreaming} Mbps. Consider cloud-hosted self-hosting (like Hetzner) for reliable remote access, or
					stick to local-only use.
				{:else}
					At {$assessment.uploadSpeed} Mbps, you can support ~{maxRemoteStreams} simultaneous 1080p remote stream{maxRemoteStreams !== 1 ? 's' : ''}, but you want {$assessment.concurrentStreams}.
					Consider Hetzner/OVH dedicated servers for remote-heavy use cases.
				{/if}
			</p>
		</div>
	{/if}

	<!-- Call to Action -->
	<div class="mb-8 rounded-xl border border-(--color-border) bg-(--color-surface-alt) p-6">
		<h3 class="mb-4 text-lg font-semibold">What's Next?</h3>
		<div class="grid gap-3 sm:grid-cols-2">
			{#if recommendation.tier !== 'stick_with_saas'}
				<button
					onclick={jumpToConfigurator}
					class="cursor-pointer rounded-lg bg-(--color-primary) px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-(--color-primary-hover)"
				>
					Build Your Docker Setup
				</button>
			{/if}
			<a
				href="/assess/about-you"
				class="rounded-lg border border-(--color-border) px-4 py-3 text-center text-sm font-medium transition-colors hover:bg-(--color-surface)"
			>
				Edit Answers
			</a>
		</div>
		{#if recommendation.tier === 'stick_with_saas'}
			<p class="mt-4 text-sm text-(--color-text-muted)">
				Not convinced? Even a minimal setup with just photo backup (Immich) can be worth it
				for the privacy benefits alone. You can still
				<button onclick={jumpToConfigurator} class="cursor-pointer text-(--color-primary) hover:underline">
					jump to the configurator
				</button> to explore.
			</p>
		{:else}
			<p class="mt-4 text-sm text-(--color-text-muted)">
				The configurator will pre-select services based on your answers and generate a ready-to-use Docker Compose setup.
			</p>
		{/if}
	</div>

	<!-- Export -->
	<div class="flex flex-wrap gap-3 text-sm">
		<button
			onclick={() => navigator.clipboard.writeText(JSON.stringify($assessment, null, 2))}
			class="cursor-pointer rounded-lg border border-(--color-border) px-4 py-2 transition-colors hover:bg-(--color-surface-alt)"
		>
			Copy Assessment JSON
		</button>
		<button
			onclick={() => {
				const blob = new Blob([JSON.stringify($assessment, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'selfhost-assessment.json';
				a.click();
				URL.revokeObjectURL(url);
			}}
			class="cursor-pointer rounded-lg border border-(--color-border) px-4 py-2 transition-colors hover:bg-(--color-surface-alt)"
		>
			Download Assessment
		</button>
	</div>
</div>
