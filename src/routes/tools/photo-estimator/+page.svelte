<script lang="ts">
	import {
		PHOTO_GROWTH_PER_YEAR,
		PHOTO_DEVICE_LABELS,
		PHOTO_SIZE_GUIDE,
		type PhotoDeviceType,
		type DeviceUsage
	} from '$lib/types/assessment';
	import { FACTORY_DEFAULTS } from '$lib/types/defaults';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';

	interface Device {
		type: PhotoDeviceType;
		usage: DeviceUsage;
	}

	let devices: Device[] = $state([{ type: 'phone', usage: 'moderate' }]);
	let existingLibraryGB = $state(0);
	let projectionYears = $state(FACTORY_DEFAULTS.growthProjectionYears);

	let annualGrowthGB = $derived(
		devices.reduce((sum, d) => sum + (PHOTO_GROWTH_PER_YEAR[d.type]?.[d.usage] ?? 0), 0)
	);

	let projectedTotalGB = $derived(existingLibraryGB + annualGrowthGB * projectionYears);

	function addDevice() {
		devices = [...devices, { type: 'phone', usage: 'moderate' }];
	}

	function removeDevice(i: number) {
		devices = devices.filter((_, idx) => idx !== i);
	}

	function fmtStorage(gb: number): string {
		if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
		return `${Math.round(gb)} GB`;
	}
</script>

<svelte:head>
	<title>Photo Library Estimator — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href="/tools" class="mb-4 inline-block text-sm text-(--color-primary) hover:underline">&larr; All Tools</a>
	<h1 class="mb-2 text-2xl font-bold">Photo Library Size Estimator</h1>
	<p class="mb-6 text-(--color-text-muted)">How much storage will your photos and videos need?</p>

	<div class="mb-6 rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/5 p-4 text-center">
		<div class="text-sm text-(--color-text-muted)">Projected storage in {projectionYears} years</div>
		<div class="text-2xl font-bold text-(--color-primary)">{fmtStorage(projectedTotalGB)}</div>
		<div class="text-sm text-(--color-text-muted)">
			{fmtStorage(existingLibraryGB)} existing + ~{annualGrowthGB} GB/year growth
		</div>
	</div>

	<div class="space-y-6">
		<div>
			<h3 class="mb-2 font-semibold">Devices</h3>
			{#each devices as device, i}
				<div class="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-(--color-border) p-3">
					<select bind:value={devices[i].type} class="h-9 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm">
						{#each Object.entries(PHOTO_DEVICE_LABELS) as [value, label]}
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
					<button onclick={() => removeDevice(i)} class="ml-auto cursor-pointer text-sm text-(--color-danger) hover:underline">Remove</button>
				</div>
			{/each}
			<button onclick={addDevice} class="cursor-pointer rounded border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) hover:border-(--color-primary) hover:text-(--color-primary)">+ Add device</button>
		</div>

		<div>
			<label for="existingLib" class="mb-1 block text-sm font-medium">Existing photo library</label>
			<NumberInput id="existingLib" bind:value={existingLibraryGB} min={0} max={50000} step={10} suffix="GB" />
		</div>

		<div>
			<label for="projYears" class="mb-1 block text-sm font-medium">Projection period</label>
			<NumberInput id="projYears" bind:value={projectionYears} min={1} max={10} step={1} suffix="years" />
		</div>

		<div class="rounded-lg bg-(--color-surface-alt) p-3 text-sm">
			<p class="mb-2 font-medium">Typical annual storage by profile:</p>
			{#each PHOTO_SIZE_GUIDE as guide}
				<div class="flex justify-between py-0.5">
					<span>{guide.label}</span>
					<span class="font-mono text-(--color-text-muted)">{guide.range}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
