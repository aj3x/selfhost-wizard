<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { LOCATIONS } from '$lib/types/assessment';
	import { STREAM_1080P_MBPS, STREAM_4K_MBPS } from '$lib/types/configurator';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import SliderInput from '$lib/components/wizard/SliderInput.svelte';
	import Tooltip from '$lib/components/wizard/Tooltip.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';

	let isBeginner = $derived($assessment.skillLevel === 'beginner');

	// Streaming bandwidth requirements (configurable constants)
	let min1080p = $derived($assessment.householdSize * STREAM_1080P_MBPS);
	let min4k = $derived($assessment.householdSize * STREAM_4K_MBPS);

	function setLocation(key: string) {
		const loc = LOCATIONS[key];
		if (loc) {
			$assessment.locationKey = key;
			$assessment.electricityRate = loc.defaultElectricityRate;
			$assessment.currency = loc.currency;
		}
	}
</script>

<h1 class="mb-2 text-2xl font-bold">About You</h1>
<p class="mb-8 text-(--color-text-muted)">
	Let's start with some basics to personalize your assessment.
</p>

<QuestionGroup
	label="How comfortable are you with technology?"
	description="This shapes the entire experience — we'll adjust complexity and recommendations accordingly."
>
	<SingleSelect
		options={[
			{
				value: 'beginner',
				label: 'Beginner',
				description: "I can install apps and follow instructions but I've never used a command line"
			},
			{
				value: 'intermediate',
				label: 'Intermediate',
				description: "I'm comfortable with basic terminal commands and have maybe run Docker before"
			},
			{
				value: 'advanced',
				label: 'Advanced',
				description: 'I manage my own servers, write scripts, and understand networking'
			}
		]}
		bind:value={$assessment.skillLevel}
		columns={3}
	/>
</QuestionGroup>

{#if isBeginner}
	<Alert type="beginner">
		No worries — we'll explain things in plain language and recommend the simplest options.
		You can always revisit with a higher skill level later.
	</Alert>
{/if}

<QuestionGroup label="How many people will use this server?">
	<SingleSelect
		options={[
			{ value: '1', label: 'Just me' },
			{ value: '2', label: '2-3 people', description: isBeginner ? 'Partner / roommates' : undefined },
			{ value: '4', label: '4-6 people', description: isBeginner ? 'Family' : undefined },
			{ value: '7', label: '7+ people', description: isBeginner ? 'Extended family / friends' : undefined }
		]}
		value={String($assessment.householdSize)}
		onchange={(v) => ($assessment.householdSize = parseInt(v))}
		columns={4}
	/>
</QuestionGroup>

<QuestionGroup label="Where are you located?" description={isBeginner ? 'This sets your currency and default electricity rate. Pick the closest match.' : undefined}>
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		{#each Object.entries(LOCATIONS) as [key, loc]}
			<button
				type="button"
				onclick={() => setLocation(key)}
				class="cursor-pointer rounded-lg border-2 p-3 text-left text-sm transition-all
					{$assessment.locationKey === key
					? 'border-(--color-primary) bg-(--color-primary)/5 font-medium'
					: 'border-(--color-border) hover:border-(--color-primary)/50'}"
			>
				{loc.label}
			</button>
		{/each}
	</div>
</QuestionGroup>

<QuestionGroup label="Electricity rate" description={isBeginner ? "Pre-filled from your location. Adjust if you know your actual rate — check your electricity bill." : "Adjust to match your actual rate if different from the regional default."}>
	<div class="flex items-center gap-3">
		<span class="text-sm text-(--color-text-muted)">
			{LOCATIONS[$assessment.locationKey]?.currency ?? 'USD'}
		</span>
		<SliderInput
			bind:value={$assessment.electricityRate}
			min={0.05}
			max={0.60}
			step={0.01}
			suffix="/kWh"
		/>
		<Tooltip text="Your cost per kilowatt-hour. This was set from your location above but you can adjust it." />
	</div>
</QuestionGroup>

<QuestionGroup
	label="Internet speeds"
	description={isBeginner
		? "Used to check if streaming outside your home will work well. Not sure? Try fast.com to test."
		: "Used to determine if remote access and streaming outside your home are feasible."}
>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="downloadSpeed" class="mb-1 block text-sm text-(--color-text-muted)">Download</label>
			<NumberInput id="downloadSpeed" bind:value={$assessment.downloadSpeed} min={1} max={10000} suffix="Mbps" />
		</div>
		<div>
			<label for="uploadSpeed" class="mb-1 block text-sm text-(--color-text-muted)">Upload</label>
			<NumberInput id="uploadSpeed" bind:value={$assessment.uploadSpeed} min={1} max={10000} suffix="Mbps" />
		</div>
	</div>
	{#if $assessment.uploadSpeed < min1080p}
		<Alert type="warning">
			Your upload speed ({$assessment.uploadSpeed} Mbps) may not be sufficient for {$assessment.householdSize}
			{$assessment.householdSize > 1 ? 'people' : 'person'} to stream remotely at 1080p (~{STREAM_1080P_MBPS} Mbps per stream, {min1080p} Mbps needed).
			This is based on all {$assessment.householdSize} user{$assessment.householdSize > 1 ? 's' : ''} streaming at once.
			You should consider a remote hosted server (like Hetzner or OVH) instead of hosting from home for remote access.
		</Alert>
	{:else if $assessment.uploadSpeed < min4k}
		<Alert type="info">
			Your upload speed ({$assessment.uploadSpeed} Mbps) supports 1080p streaming for
			{$assessment.householdSize} {$assessment.householdSize > 1 ? 'people' : 'person'} (~{STREAM_1080P_MBPS} Mbps each),
			but not 4K (~{STREAM_4K_MBPS} Mbps per stream, {min4k} Mbps needed).
			This is based on all {$assessment.householdSize} user{$assessment.householdSize > 1 ? 's' : ''} streaming at once.
			You can lower the remote streaming resolution, or consider a remote hosted server for 4K quality.
		</Alert>
	{/if}
</QuestionGroup>
