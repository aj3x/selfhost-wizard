<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import type { ExistingDrive, ExistingSSD } from '$lib/types/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';
	import RecommendedBadge from '$lib/components/shared/RecommendedBadge.svelte';

	let skill = $derived($assessment.skillLevel);
	let isBeginner = $derived(skill === 'beginner');
	let hasMachine = $derived(
		$assessment.byod.machineType !== 'none' && $assessment.byod.machineType !== 'unsure'
	);

	let totalExistingStorageGB = $derived(
		$assessment.byod.existingDrives.reduce((sum, d) => sum + d.sizeGB, 0) +
		$assessment.byod.existingSSDs.reduce((sum, s) => sum + s.sizeGB, 0)
	);

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
	Do you already have hardware you could use? Using what you have dramatically lowers upfront costs.
</p>

{#if isBeginner}
	<Alert type="beginner">
		If you have an old laptop or desktop sitting around, it can make a great starter server.
		Don't worry if you're not sure about specs — we'll estimate what we can.
	</Alert>
{/if}

<QuestionGroup label="Do you have a machine you could use?">
	<SingleSelect
		options={[
			{ value: 'none', label: "Starting from scratch", description: "I need to buy something — we'll recommend hardware" },
			{ value: 'desktop', label: 'Old Desktop', description: isBeginner ? 'A tower PC you no longer use' : 'Tower PC, typically 60-120W' },
			{ value: 'laptop', label: 'Old Laptop', description: isBeginner ? 'A laptop gathering dust — great for starters!' : 'Limited storage expansion, 15-45W' },
			{ value: 'dual_purpose', label: 'Current PC (dual use)', description: 'Your daily computer pulling double duty' },
			{ value: 'mini_pc', label: 'Mini PC', description: isBeginner ? 'Intel NUC, Beelink, etc.' : 'Intel NUC, Beelink, etc. 6-25W' },
			{ value: 'enterprise', label: 'Enterprise Hardware', description: 'Dell Optiplex, HP ProDesk, etc.' },
			{ value: 'nas', label: 'Existing NAS', description: 'Synology, QNAP, Ugreen, etc.' },
			{ value: 'unsure', label: "Not sure yet", description: "We'll estimate costs as if buying new" }
		]}
		bind:value={$assessment.byod.machineType}
		columns={2}
	/>
</QuestionGroup>

{#if $assessment.byod.machineType === 'laptop'}
	<Alert type="tip">
		Old laptops are excellent starter servers — built-in battery backup, low power draw, and quiet.
		Just remember to change your settings so it doesn't sleep when you close the lid, and monitor
		the battery health to avoid swelling.
	</Alert>
{/if}

{#if $assessment.byod.machineType === 'dual_purpose'}
	<Alert type="warning">
		Running a server on your daily computer works, but services will stop when you restart or shut down.
		It's a fine way to experiment, but you'll probably want dedicated hardware eventually.
	</Alert>
{/if}

{#if $assessment.byod.machineType === 'unsure'}
	<Alert type="info">
		No problem! We'll calculate costs as if you're buying new hardware. You can always come back and
		update this if you find something to repurpose.
	</Alert>
{/if}

<ConditionalSection visible={hasMachine}>
	{#if skill !== 'beginner'}
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
	{/if}

	<QuestionGroup label="Existing storage drives" description={isBeginner ? "Any hard drives or SSDs in or for this machine. Skip if you're not sure." : undefined}>
		{#each $assessment.byod.existingDrives as drive, i}
			<div class="mb-2 rounded-lg border border-(--color-border) p-3">
				<div class="flex flex-wrap items-center gap-3">
					<div>
						<span class="text-xs text-(--color-text-muted)">Size</span>
						<NumberInput bind:value={drive.sizeGB} min={100} max={24000} step={100} suffix="GB" />
					</div>
					<div>
						<span class="text-xs text-(--color-text-muted)">Type</span>
						<SingleSelect
							options={[
								{ value: 'hdd', label: 'HDD' },
								{ value: 'ssd', label: 'SSD' }
							]}
							bind:value={drive.type}
							columns={2}
						/>
					</div>
					{#if skill !== 'beginner'}
						<div>
							<span class="text-xs text-(--color-text-muted)">Age</span>
							<NumberInput bind:value={drive.ageYears} min={0} max={15} suffix="years" />
						</div>
						<label class="flex items-center gap-2 text-sm">
							<input type="checkbox" bind:checked={drive.isNASRated} class="accent-(--color-primary)" />
							NAS-rated
						</label>
					{/if}
					<button
						type="button"
						onclick={() => removeDrive(i)}
						class="ml-auto cursor-pointer text-sm text-(--color-danger) hover:underline"
					>
						Remove
					</button>
				</div>
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

	{#if skill !== 'beginner'}
		<QuestionGroup label="Existing SSDs (for OS / configs)">
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
	{/if}

	{#if totalExistingStorageGB > 0}
		<div class="my-4 rounded-lg bg-(--color-surface-alt) p-3 text-sm">
			Total existing storage: <strong>{(totalExistingStorageGB / 1000).toFixed(1)} TB</strong> ({totalExistingStorageGB} GB)
		</div>
	{/if}

	<QuestionGroup label="Other equipment you already have">
		<div class="flex flex-col gap-3">
			<label class="flex items-center gap-3 text-sm">
				<input type="checkbox" bind:checked={$assessment.byod.hasUPS} class="accent-(--color-primary)" />
				UPS (battery backup)
				{#if isBeginner}
					<span class="text-xs text-(--color-text-muted)">— keeps the server running during power outages</span>
				{/if}
			</label>
			<label class="flex items-center gap-3 text-sm">
				<input type="checkbox" bind:checked={$assessment.byod.hasNetworkingGear} class="accent-(--color-primary)" />
				Good networking gear (managed switch, decent router)
			</label>
		</div>
	</QuestionGroup>
</ConditionalSection>
