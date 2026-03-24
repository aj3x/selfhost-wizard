<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { defaults } from '$lib/stores/defaults';
	import {
		PHOTO_GROWTH_PER_YEAR,
		PHOTO_DEVICE_LABELS,
		PHOTO_SIZE_GUIDE,
		type PhotoDeviceType,
		type DeviceUsage
	} from '$lib/types/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';
	import RecommendedBadge from '$lib/components/shared/RecommendedBadge.svelte';

	let skill = $derived($assessment.skillLevel);
	let isBeginner = $derived(skill === 'beginner');

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

	let showSizeGuide = $state(false);

	function addDevice() {
		$assessment.photoDevices = [
			...$assessment.photoDevices,
			{ type: 'phone', usage: 'moderate', shootsVideo: 'some' }
		];
	}

	function removeDevice(index: number) {
		$assessment.photoDevices = $assessment.photoDevices.filter((_, i) => i !== index);
	}
</script>

<h1 class="mb-2 text-2xl font-bold">Photos & Video Backup</h1>
<p class="mb-8 text-(--color-text-muted)">
	Replace Google Photos or iCloud with your own private photo library — with face recognition, smart search, and no monthly fees.
</p>

{#if isBeginner}
	<Alert type="beginner">
		Self-hosting photos means your pictures and videos are stored on your own server instead of Google or Apple's.
		Apps like <strong>Immich</strong> give you the same experience as Google Photos — auto-backup from your phone,
		face recognition, smart search — but you own the data and pay no subscription.
	</Alert>
{/if}

<QuestionGroup label="What's your goal for photo backup?">
	<SingleSelect
		options={[
			{
				value: 'replace',
				label: 'Replace cloud photos',
				description: 'Move away from Google Photos / iCloud and self-host everything'
			},
			{
				value: 'additional',
				label: 'Extra backup',
				description: 'Keep cloud service but add a private backup copy'
			},
			{
				value: 'no',
				label: 'Skip this',
				description: "I don't need photo backup on my server"
			}
		]}
		value={$assessment.photoBackupIntent}
		onchange={(v) => ($assessment.photoBackupIntent = v)}
		columns={isBeginner ? 1 : 3}
	/>
	{#if isBeginner && $assessment.photoBackupIntent === 'no'}
		<p class="mt-2 text-sm text-(--color-text-muted)">
			No problem — you can always add this later.
		</p>
	{/if}
</QuestionGroup>

<ConditionalSection visible={$assessment.photoBackupIntent !== 'no'}>
	<QuestionGroup
		label="Which devices take photos/videos?"
		description="Add each device that will auto-upload to your server. This helps estimate storage needs."
	>
		{#each $assessment.photoDevices as device, i}
			<div class="mb-2 rounded-lg border border-(--color-border) p-3">
				<div class="flex flex-wrap items-center gap-3">
					<select
						bind:value={$assessment.photoDevices[i].type}
						class="h-9 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm"
					>
						{#each Object.entries(PHOTO_DEVICE_LABELS) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>

					<div class="flex-1">
						<SingleSelect
							options={[
								{ value: 'light', label: 'Light', description: isBeginner ? 'A few photos/week' : undefined },
								{ value: 'moderate', label: 'Moderate', description: isBeginner ? 'Photos most days' : undefined },
								{ value: 'heavy', label: 'Heavy', description: isBeginner ? 'Many photos daily' : undefined }
							]}
							bind:value={device.usage}
							columns={3}
						/>
					</div>

					<button
						type="button"
						onclick={() => removeDevice(i)}
						class="ml-auto cursor-pointer text-sm text-(--color-danger) hover:underline"
					>
						Remove
					</button>
				</div>

				{#if skill !== 'beginner'}
					<div class="mt-2">
						<span class="text-xs text-(--color-text-muted)">Shoots video?</span>
						<SingleSelect
							options={[
								{ value: 'yes', label: 'Often' },
								{ value: 'some', label: 'Sometimes' },
								{ value: 'rarely', label: 'Rarely' }
							]}
							bind:value={device.shootsVideo}
							columns={3}
						/>
					</div>
				{/if}
			</div>
		{/each}

		<button
			type="button"
			onclick={addDevice}
			class="mt-2 cursor-pointer rounded-lg border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) transition-colors hover:border-(--color-primary) hover:text-(--color-primary)"
		>
			+ Add device
		</button>

		{#if $assessment.photoDevices.length === 0}
			<p class="mt-2 text-sm text-(--color-text-muted)">
				Add at least one device to estimate your storage needs.
			</p>
		{/if}
	</QuestionGroup>

	<QuestionGroup label="Existing photo library size" description="How much space do your current photos and videos take up? Check your Google Photos or iCloud storage settings if unsure.">
		<NumberInput bind:value={$assessment.existingPhotoLibraryGB} min={0} max={50000} step={10} suffix="GB" />

		<button
			type="button"
			onclick={() => (showSizeGuide = !showSizeGuide)}
			class="mt-2 cursor-pointer text-sm text-(--color-primary) hover:underline"
		>
			{showSizeGuide ? 'Hide' : 'Show'} size guide
		</button>

		{#if showSizeGuide}
			<div class="mt-2 rounded-lg bg-(--color-surface-alt) p-3 text-sm">
				<p class="mb-2 font-medium">Typical annual photo/video storage:</p>
				{#each PHOTO_SIZE_GUIDE as guide}
					<div class="flex justify-between py-0.5">
						<span>{guide.label}</span>
						<span class="font-mono text-(--color-text-muted)">{guide.range}</span>
					</div>
				{/each}
			</div>
		{/if}

		{#if $assessment.photoDevices.length > 0}
			<div class="mt-3 rounded-lg bg-(--color-surface-alt) p-3 text-sm">
				<div class="flex justify-between">
					<span>Estimated annual growth:</span>
					<span class="font-medium">~{annualGrowthGB} GB/year</span>
				</div>
				<div class="mt-1 flex justify-between">
					<span>Projected in {$defaults.growthProjectionYears} years:</span>
					<span class="font-bold text-(--color-primary)">
						{Math.round(projectedTotalGB)} GB ({(projectedTotalGB / 1000).toFixed(1)} TB)
					</span>
				</div>
			</div>
		{/if}
	</QuestionGroup>

	<QuestionGroup
		label="Smart features"
		description="AI-powered features like face detection, smart search, and automatic albums."
	>
		<SingleSelect
			options={[
				{
					value: 'full',
					label: 'Full ML features',
					description: 'Face recognition, smart search, auto-albums — uses more RAM & CPU'
				},
				{
					value: 'basic',
					label: 'Basic features',
					description: 'Thumbnail generation and simple search — lighter on resources'
				},
				{
					value: 'backup_only',
					label: 'Backup only',
					description: 'Just store and browse — minimal resource usage'
				}
			]}
			value={$assessment.mlPreference}
			onchange={(v) => ($assessment.mlPreference = v)}
			columns={isBeginner ? 1 : 3}
		/>
		{#if isBeginner}
			<p class="mt-2 text-sm text-(--color-text-muted)">
				<RecommendedBadge show={$assessment.mlPreference !== 'basic'} />
				{#if $assessment.mlPreference === 'full'}
					Full ML features work great but need a slightly more powerful computer (~4 GB extra RAM).
				{:else if $assessment.mlPreference === 'backup_only'}
					This keeps things simple — you can always enable smart features later.
				{:else}
					A good balance of features without heavy resource use.
				{/if}
			</p>
		{/if}
	</QuestionGroup>
</ConditionalSection>
