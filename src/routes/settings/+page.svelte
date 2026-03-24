<script lang="ts">
	import { defaults } from '$lib/stores/defaults';
	import { assessment } from '$lib/stores/assessment';
	import { FACTORY_DEFAULTS, type CalculationDefaults } from '$lib/types/defaults';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';

	let showImport = $state(false);
	let importText = $state('');
	let importError = $state('');
	let exportCopied = $state(false);

	type Section = {
		title: string;
		fields: { key: keyof CalculationDefaults; label: string; step: number; suffix?: string }[];
	};

	const sections: Section[] = [
		{
			title: 'Media File Sizes (GB)',
			fields: [
				{ key: 'movieSize720p', label: 'Movie (720p)', step: 0.5 },
				{ key: 'movieSize1080p', label: 'Movie (1080p)', step: 1 },
				{ key: 'movieSize4k', label: 'Movie (4K)', step: 5 },
				{ key: 'movieSize4kHdr', label: 'Movie (4K HDR)', step: 5 },
				{ key: 'episodeSize720p', label: 'Episode (720p)', step: 0.1 },
				{ key: 'episodeSize1080p', label: 'Episode (1080p)', step: 0.5 },
				{ key: 'episodeSize4k', label: 'Episode (4K)', step: 1 },
				{ key: 'episodeSize4kHdr', label: 'Episode (4K HDR)', step: 1 },
				{ key: 'avgEpisodesPerSeason', label: 'Avg episodes/season', step: 1 }
			]
		},
		{
			title: 'Growth & Projections',
			fields: [
				{ key: 'mediaGrowthRateAnnual', label: 'Media growth rate/yr', step: 0.05 },
				{ key: 'fileGrowthRateAnnual', label: 'File growth rate/yr', step: 0.05 },
				{ key: 'growthProjectionYears', label: 'Projection years', step: 1, suffix: 'yr' },
				{ key: 'storageHeadroomMultiplier', label: 'Storage headroom multiplier', step: 0.05 },
				{ key: 'systemOverheadGB', label: 'System overhead', step: 10, suffix: 'GB' }
			]
		},
		{
			title: 'Drive Failure Rates (AFR)',
			fields: [
				{ key: 'hddAfr', label: 'HDD AFR', step: 0.005 },
				{ key: 'ssdAfr', label: 'SSD AFR', step: 0.001 },
				{ key: 'nasDriveAfr', label: 'NAS drive AFR', step: 0.005 },
				{ key: 'consumerWarrantyYears', label: 'Consumer warranty', step: 1, suffix: 'yr' },
				{ key: 'nasWarrantyYears', label: 'NAS warranty', step: 1, suffix: 'yr' },
				{ key: 'driveLifespanYears', label: 'Drive lifespan', step: 1, suffix: 'yr' }
			]
		},
		{
			title: 'Costs',
			fields: [
				{ key: 'hddPricePerTB', label: 'HDD price', step: 5, suffix: '$/TB' },
				{ key: 'ssdPricePerTB', label: 'SSD price', step: 10, suffix: '$/TB' },
				{ key: 'offsiteCostPerTbMonth', label: 'Off-site backup', step: 0.5, suffix: '$/TB/mo' },
				{ key: 'domainAnnualCost', label: 'Domain cost', step: 1, suffix: '$/yr' },
				{ key: 'vpnMonthlyDefault', label: 'VPN default', step: 0.5, suffix: '$/mo' },
				{ key: 'plexPassMonthly', label: 'Plex Pass', step: 0.5, suffix: '$/mo' }
			]
		},
		{
			title: 'Break-Even',
			fields: [
				{ key: 'tcoProjectionYears', label: 'TCO projection', step: 1, suffix: 'yr' },
				{ key: 'saasPriceInflationAnnual', label: 'SaaS price inflation/yr', step: 0.01 }
			]
		}
	];

	function isModified(key: keyof CalculationDefaults): boolean {
		return $defaults[key] !== FACTORY_DEFAULTS[key];
	}

	function resetField(key: keyof CalculationDefaults) {
		$defaults[key] = FACTORY_DEFAULTS[key];
	}

	function exportAssessment() {
		const data = JSON.stringify({ assessment: $assessment, defaults: $defaults }, null, 2);
		navigator.clipboard.writeText(data);
		exportCopied = true;
		setTimeout(() => (exportCopied = false), 2000);
	}

	function downloadAssessment() {
		const data = JSON.stringify({ assessment: $assessment, defaults: $defaults }, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'selfhost-wizard-data.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function importData() {
		importError = '';
		try {
			const data = JSON.parse(importText);
			if (data.assessment) {
				assessment.importJSON(JSON.stringify(data.assessment));
			}
			if (data.defaults) {
				defaults.set({ ...FACTORY_DEFAULTS, ...data.defaults });
			}
			showImport = false;
			importText = '';
		} catch (e) {
			importError = 'Invalid JSON. Please check the format and try again.';
		}
	}
</script>

<svelte:head>
	<title>Settings — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-2 text-2xl font-bold">Settings</h1>
	<p class="mb-8 text-(--color-text-muted)">
		Tweak calculation assumptions and manage your data. Changes are saved automatically.
	</p>

	<!-- Data Management -->
	<div class="mb-8 rounded-xl border border-(--color-border) p-6">
		<h2 class="mb-4 text-lg font-semibold">Data Management</h2>
		<div class="flex flex-wrap gap-3">
			<button
				onclick={exportAssessment}
				class="cursor-pointer rounded-lg border border-(--color-border) px-4 py-2 text-sm transition-colors hover:bg-(--color-surface-alt)"
			>
				{exportCopied ? 'Copied!' : 'Copy to Clipboard'}
			</button>
			<button
				onclick={downloadAssessment}
				class="cursor-pointer rounded-lg border border-(--color-border) px-4 py-2 text-sm transition-colors hover:bg-(--color-surface-alt)"
			>
				Download JSON
			</button>
			<button
				onclick={() => (showImport = !showImport)}
				class="cursor-pointer rounded-lg border border-(--color-border) px-4 py-2 text-sm transition-colors hover:bg-(--color-surface-alt)"
			>
				Import Data
			</button>
			<button
				onclick={() => { assessment.reset(); defaults.reset(); }}
				class="cursor-pointer rounded-lg border border-(--color-danger)/30 px-4 py-2 text-sm text-(--color-danger) transition-colors hover:bg-(--color-danger)/5"
			>
				Reset Everything
			</button>
		</div>

		{#if showImport}
			<div class="mt-4">
				<textarea
					bind:value={importText}
					placeholder='Paste JSON data here (from "Copy to Clipboard" or downloaded file)'
					class="h-32 w-full rounded-lg border border-(--color-border) bg-(--color-surface) p-3 font-mono text-xs"
				></textarea>
				{#if importError}
					<p class="mt-1 text-sm text-(--color-danger)">{importError}</p>
				{/if}
				<button
					onclick={importData}
					class="mt-2 cursor-pointer rounded-lg bg-(--color-primary) px-4 py-2 text-sm text-white hover:bg-(--color-primary-hover)"
				>
					Import
				</button>
			</div>
		{/if}
	</div>

	<!-- Calculation Defaults -->
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Calculation Defaults</h2>
		<button
			onclick={() => defaults.reset()}
			class="cursor-pointer text-sm text-(--color-primary) hover:underline"
		>
			Reset all to factory defaults
		</button>
	</div>

	{#each sections as section}
		<div class="mb-6 rounded-xl border border-(--color-border) p-4">
			<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">{section.title}</h3>
			<div class="space-y-2">
				{#each section.fields as field}
					<div class="flex items-center gap-3">
						<span class="min-w-[180px] text-sm" class:font-medium={isModified(field.key)} class:text-(--color-primary)={isModified(field.key)}>
							{field.label}
							{#if field.suffix}<span class="text-xs text-(--color-text-muted)">({field.suffix})</span>{/if}
						</span>
						<div class="flex-1">
							<NumberInput
								value={$defaults[field.key]}
								onchange={(v) => ($defaults[field.key] = v)}
								min={0}
								max={999}
								step={field.step}
							/>
						</div>
						{#if isModified(field.key)}
							<button
								onclick={() => resetField(field.key)}
								class="cursor-pointer text-xs text-(--color-text-muted) hover:text-(--color-primary)"
								title="Reset to {FACTORY_DEFAULTS[field.key]}"
							>
								reset
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}

	<div class="mt-4 text-center">
		<a href="/results" class="text-sm text-(--color-primary) hover:underline">Back to Results &rarr;</a>
	</div>
</div>
