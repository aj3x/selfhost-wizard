<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import type { MachineType, ExistingDrive, ExistingSSD } from '$lib/types/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';

	let hasMachine = $derived($assessment.byod.machineType !== 'none');

	function addDrive() {
		$assessment.byod.existingDrives = [
			...$assessment.byod.existingDrives,
			{ sizeGB: 1000, type: 'hdd', ageYears: 2, isNASRated: false }
		];
	}

	function removeDrive(index: number) {
		$assessment.byod.existingDrives = $assessment.byod.existingDrives.filter((_, i) => i !== index);
	}

	function addSSD() {
		$assessment.byod.existingSSDs = [
			...$assessment.byod.existingSSDs,
			{ sizeGB: 256, ageYears: 1 }
		];
	}

	function removeSSD(index: number) {
		$assessment.byod.existingSSDs = $assessment.byod.existingSSDs.filter((_, i) => i !== index);
	}
</script>

<h1 class="mb-2 text-2xl font-bold">Existing Hardware</h1>
<p class="mb-8 text-(--color-text-muted)">
	Do you already have hardware you could use? This significantly affects upfront costs.
</p>

<QuestionGroup label="Do you have a machine you could use?">
	<SingleSelect
		options={[
			{ value: 'none', label: 'No — I need to buy something', description: "We'll recommend hardware" },
			{ value: 'desktop', label: 'Old Desktop', description: 'Tower PC, typically 60-120W' },
			{ value: 'laptop', label: 'Laptop', description: 'Limited storage expansion, 15-45W' },
			{ value: 'mini_pc', label: 'Mini PC', description: 'Intel NUC, Beelink, etc. 6-25W' },
			{ value: 'enterprise', label: 'Enterprise Hardware', description: 'Dell/HP server, loud & power-hungry' },
			{ value: 'nas', label: 'Existing NAS', description: 'Synology, QNAP, Ugreen, etc.' }
		]}
		bind:value={$assessment.byod.machineType}
		columns={2}
	/>
</QuestionGroup>

<ConditionalSection visible={hasMachine}>
	<QuestionGroup
		label="Estimated wattage"
		description="Leave blank to use our estimate based on machine type."
	>
		<NumberInput
			value={$assessment.byod.machineWattage ?? 0}
			onchange={(v) => ($assessment.byod.machineWattage = v || null)}
			min={0}
			max={2000}
			suffix="watts"
		/>
	</QuestionGroup>

	<QuestionGroup label="Existing storage drives (HDDs)">
		{#each $assessment.byod.existingDrives as drive, i}
			<div class="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-(--color-border) p-3">
				<div>
					<label class="text-xs text-(--color-text-muted)">Size</label>
					<NumberInput bind:value={drive.sizeGB} min={100} max={24000} step={100} suffix="GB" />
				</div>
				<div>
					<label class="text-xs text-(--color-text-muted)">Type</label>
					<SingleSelect
						options={[
							{ value: 'hdd', label: 'HDD' },
							{ value: 'ssd', label: 'SSD' }
						]}
						bind:value={drive.type}
						columns={2}
					/>
				</div>
				<div>
					<label class="text-xs text-(--color-text-muted)">Age</label>
					<NumberInput bind:value={drive.ageYears} min={0} max={15} suffix="years" />
				</div>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={drive.isNASRated} class="accent-(--color-primary)" />
					NAS-rated
				</label>
				<button
					type="button"
					onclick={() => removeDrive(i)}
					class="ml-auto cursor-pointer text-sm text-(--color-danger) hover:underline"
				>
					Remove
				</button>
			</div>
		{/each}
		<button
			type="button"
			onclick={addDrive}
			class="mt-2 cursor-pointer rounded-lg border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) transition-colors hover:border-(--color-primary) hover:text-(--color-primary)"
		>
			+ Add drive
		</button>
	</QuestionGroup>

	<QuestionGroup label="Existing SSDs (for OS/configs)">
		{#each $assessment.byod.existingSSDs as ssd, i}
			<div class="mb-2 flex items-center gap-3 rounded-lg border border-(--color-border) p-3">
				<NumberInput bind:value={ssd.sizeGB} min={32} max={8000} step={64} suffix="GB" />
				<NumberInput bind:value={ssd.ageYears} min={0} max={15} suffix="years old" />
				<button
					type="button"
					onclick={() => removeSSD(i)}
					class="ml-auto cursor-pointer text-sm text-(--color-danger) hover:underline"
				>
					Remove
				</button>
			</div>
		{/each}
		<button
			type="button"
			onclick={addSSD}
			class="mt-2 cursor-pointer rounded-lg border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) transition-colors hover:border-(--color-primary) hover:text-(--color-primary)"
		>
			+ Add SSD
		</button>
	</QuestionGroup>

	<QuestionGroup label="Other equipment">
		<div class="flex flex-col gap-3">
			<label class="flex items-center gap-3 text-sm">
				<input type="checkbox" bind:checked={$assessment.byod.hasUPS} class="accent-(--color-primary)" />
				I have a UPS (battery backup)
			</label>
			<label class="flex items-center gap-3 text-sm">
				<input type="checkbox" bind:checked={$assessment.byod.hasNetworkingGear} class="accent-(--color-primary)" />
				I have decent networking gear (managed switch, good router)
			</label>
		</div>
	</QuestionGroup>
</ConditionalSection>
