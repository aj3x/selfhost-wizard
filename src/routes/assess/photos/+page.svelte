<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { defaults } from '$lib/stores/defaults';
	import { PHOTO_GROWTH_PER_YEAR, type PhotoDeviceType, type DeviceUsage } from '$lib/types/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';

	const DEVICE_LABELS: Record<PhotoDeviceType, string> = {
		phone: 'Phone',
		tablet: 'Tablet',
		dslr: 'DSLR / Mirrorless',
		action_cam: 'Action Camera',
		drone: 'Drone'
	};

	let annualGrowthGB = $derived(
		$assessment.photoDevices.reduce(
			(sum, d) => sum + (PHOTO_GROWTH_PER_YEAR[d.type]?.[d.usage] ?? 0),
			0
		)
	);

	let projectedTotalGB = $derived(
		$assessment.existingPhotoLibraryGB +
			annualGrowthGB * $defaults.growthProjectionYears
	);

	function addDevice() {
		$assessment.photoDevices = [
			...$assessment.photoDevices,
			{ type: 'phone', usage: 'moderate' }
		];
	}

	function removeDevice(index: number) {
		$assessment.photoDevices = $assessment.photoDevices.filter((_, i) => i !== index);
	}
</script>

<h1 class="mb-2 text-2xl font-bold">Photos & Video Backup</h1>
<p class="mb-8 text-(--color-text-muted)">
	Replace Google Photos or iCloud with your own private photo backup and AI-powered search.
</p>

<QuestionGroup label="Do you want to self-host photo backup?">
	<SingleSelect
		options={[
			{ value: 'true', label: 'Yes', description: 'Private photo backup with Immich (Google Photos alternative)' },
			{ value: 'false', label: 'No', description: "I'll keep using my current service" }
		]}
		value={String($assessment.wantsPhotoBackup)}
		onchange={(v) => ($assessment.wantsPhotoBackup = v === 'true')}
		columns={2}
	/>
</QuestionGroup>

<ConditionalSection visible={$assessment.wantsPhotoBackup}>
	<QuestionGroup label="Devices that will back up photos">
		{#each $assessment.photoDevices as device, i}
			<div class="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-(--color-border) p-3">
				<select
					bind:value={$assessment.photoDevices[i].type}
					class="h-9 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm"
				>
					{#each Object.entries(DEVICE_LABELS) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>

				<SingleSelect
					options={[
						{ value: 'light', label: 'Light' },
						{ value: 'moderate', label: 'Moderate' },
						{ value: 'heavy', label: 'Heavy' }
					]}
					bind:value={device.usage}
					columns={3}
				/>

				<button
					type="button"
					onclick={() => removeDevice(i)}
					class="ml-auto cursor-pointer text-sm text-(--color-danger) hover:underline"
				>
					Remove
				</button>
			</div>
		{/each}
		<button
			type="button"
			onclick={addDevice}
			class="mt-2 cursor-pointer rounded-lg border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) transition-colors hover:border-(--color-primary) hover:text-(--color-primary)"
		>
			+ Add device
		</button>
	</QuestionGroup>

	<QuestionGroup label="Existing photo library size">
		<NumberInput bind:value={$assessment.existingPhotoLibraryGB} min={0} max={50000} step={10} suffix="GB" />
		<div class="mt-3 rounded-lg bg-(--color-surface-alt) p-3 text-sm">
			<div>Annual growth: ~{annualGrowthGB} GB/year</div>
			<div>
				Projected in {$defaults.growthProjectionYears} years: <strong>{Math.round(projectedTotalGB)} GB</strong>
				({(projectedTotalGB / 1000).toFixed(1)} TB)
			</div>
		</div>
	</QuestionGroup>

	<QuestionGroup
		label="ML features"
		description="Face recognition, smart search, automatic albums — requires more RAM & CPU."
	>
		<SingleSelect
			options={[
				{ value: 'true', label: 'Yes', description: 'Like Google Photos smart features' },
				{ value: 'false', label: 'No', description: 'Just backup and browsing' }
			]}
			value={String($assessment.wantsMLFeatures)}
			onchange={(v) => ($assessment.wantsMLFeatures = v === 'true')}
			columns={2}
		/>
	</QuestionGroup>
</ConditionalSection>
