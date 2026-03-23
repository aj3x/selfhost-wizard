<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';

	let totalBackupGB = $derived($assessment.computers.reduce((sum, c) => sum + c.sizeGB, 0));

	function addComputer() {
		$assessment.computers = [
			...$assessment.computers,
			{ name: `Computer ${$assessment.computers.length + 1}`, sizeGB: 100 }
		];
	}

	function removeComputer(index: number) {
		$assessment.computers = $assessment.computers.filter((_, i) => i !== index);
	}
</script>

<h1 class="mb-2 text-2xl font-bold">Files & Backup</h1>
<p class="mb-8 text-(--color-text-muted)">
	Replace Dropbox, Google Drive, or OneDrive with your own file sync and backup.
</p>

<QuestionGroup label="Do you want file sync / backup?">
	<SingleSelect
		options={[
			{ value: 'true', label: 'Yes', description: 'Sync files across devices, backup computers' },
			{ value: 'false', label: 'No', description: "I'll keep using cloud storage" }
		]}
		value={String($assessment.wantsFileSync)}
		onchange={(v) => ($assessment.wantsFileSync = v === 'true')}
		columns={2}
	/>
</QuestionGroup>

<ConditionalSection visible={$assessment.wantsFileSync}>
	<QuestionGroup label="Computers needing backup">
		{#each $assessment.computers as computer, i}
			<div class="mb-2 flex items-center gap-3 rounded-lg border border-(--color-border) p-3">
				<input
					type="text"
					bind:value={$assessment.computers[i].name}
					class="h-8 w-40 rounded border border-(--color-border) bg-(--color-surface) px-3 text-sm"
					placeholder="Computer name"
				/>
				<NumberInput bind:value={computer.sizeGB} min={1} max={50000} step={50} suffix="GB" />
				<button
					type="button"
					onclick={() => removeComputer(i)}
					class="ml-auto cursor-pointer text-sm text-(--color-danger) hover:underline"
				>
					Remove
				</button>
			</div>
		{/each}
		<button
			type="button"
			onclick={addComputer}
			class="mt-2 cursor-pointer rounded-lg border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) transition-colors hover:border-(--color-primary) hover:text-(--color-primary)"
		>
			+ Add computer
		</button>
		{#if $assessment.computers.length > 0}
			<p class="mt-2 text-sm text-(--color-text-muted)">Total: {totalBackupGB} GB</p>
		{/if}
	</QuestionGroup>

	<QuestionGroup label="Backup type">
		<SingleSelect
			options={[
				{ value: 'sync', label: 'Sync only', description: 'Mirror files — no version history' },
				{ value: 'versioned', label: 'Versioned backup', description: 'Keep 30-90 days of old versions' },
				{ value: 'both', label: 'Both', description: 'Sync + versioned backup' }
			]}
			bind:value={$assessment.backupType}
			columns={3}
		/>
	</QuestionGroup>

	<QuestionGroup label="Will you work directly off the server?">
		<SingleSelect
			options={[
				{ value: 'heavy', label: 'Heavy editing', description: 'Video editing, large files — needs fast I/O' },
				{ value: 'occasional', label: 'Occasional access', description: 'Open files sometimes' },
				{ value: 'no', label: 'No', description: 'Just sync/backup, work on local copies' }
			]}
			bind:value={$assessment.worksOffServer}
			columns={3}
		/>
	</QuestionGroup>

	<QuestionGroup label="Per-user file spaces?">
		<SingleSelect
			options={[
				{ value: 'true', label: 'Yes', description: 'Each person gets their own storage area' },
				{ value: 'false', label: 'No', description: 'Shared storage is fine' }
			]}
			value={String($assessment.needsPersonalSpaces)}
			onchange={(v) => ($assessment.needsPersonalSpaces = v === 'true')}
			columns={2}
		/>
	</QuestionGroup>
</ConditionalSection>
