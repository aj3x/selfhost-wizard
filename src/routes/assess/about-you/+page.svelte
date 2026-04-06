<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { LOCATIONS } from '$lib/types/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import SliderInput from '$lib/components/wizard/SliderInput.svelte';
	import Tooltip from '$lib/components/wizard/Tooltip.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';

	let isBeginner = $derived($assessment.skillLevel === 'beginner');
	let minUploadForHousehold = $derived(Math.max(10, $assessment.householdSize * 5));

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

<QuestionGroup label="Where are you located?" description={isBeginner ? 'This sets your electricity rate and currency. Pick the closest match.' : undefined}>
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

{#if $assessment.skillLevel !== 'beginner'}
	<QuestionGroup label="Electricity rate">
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
			<Tooltip text="Your cost per kilowatt-hour. Check your electricity bill or use the regional default." />
		</div>
	</QuestionGroup>
{/if}

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
	{#if $assessment.uploadSpeed < minUploadForHousehold}
		<Alert type="warning">
			Your upload speed ({$assessment.uploadSpeed} Mbps) is low for a household of {$assessment.householdSize}.
			Remote streaming and photo backup sync will be slow. You'd want at least {minUploadForHousehold} Mbps for {$assessment.householdSize} user{$assessment.householdSize > 1 ? 's' : ''}.
		</Alert>
	{/if}
</QuestionGroup>
