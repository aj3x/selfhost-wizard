<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';
	import RecommendedBadge from '$lib/components/shared/RecommendedBadge.svelte';

	let skill = $derived($assessment.skillLevel);
	let isBeginner = $derived(skill === 'beginner');

	let totalBackupGB = $derived($assessment.computers.reduce((sum, c) => sum + c.sizeGB, 0));

	let multipleUsers = $derived($assessment.householdSize > 1);

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
	Replace Dropbox, Google Drive, or OneDrive with your own file sync and backup solution.
</p>

{#if isBeginner}
	<Alert type="beginner">
		File sync keeps your documents, spreadsheets, and other files available on all your devices — just like
		Dropbox or Google Drive, but stored on your server instead of someone else's.
	</Alert>
{/if}

<QuestionGroup label="Do you want file sync or backup on your server?">
	<SingleSelect
		options={[
			{
				value: 'replace',
				label: 'Replace cloud storage',
				description: isBeginner ? 'Move away from Dropbox/Google Drive' : 'Replace Dropbox/OneDrive/Google Drive'
			},
			{
				value: 'additional',
				label: 'Additional backup',
				description: 'Keep cloud but add a private backup copy'
			},
			{
				value: 'false',
				label: 'No',
				description: "I'll keep using cloud storage"
			}
		]}
		value={$assessment.wantsFileSync ? 'replace' : 'false'}
		onchange={(v) => ($assessment.wantsFileSync = v !== 'false')}
		columns={isBeginner ? 1 : 3}
	/>
</QuestionGroup>

<ConditionalSection visible={$assessment.wantsFileSync}>
	<QuestionGroup label="Which computers need backup?" description={isBeginner ? "Add each computer you want backed up, with roughly how much data it has." : undefined}>
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
			<div class="mt-2 rounded-lg bg-(--color-surface-alt) p-2 text-sm">
				Total backup data: <strong>{totalBackupGB} GB</strong> ({(totalBackupGB / 1000).toFixed(1)} TB)
			</div>
		{/if}
	</QuestionGroup>

	<QuestionGroup label="What kind of backup do you need?">
		{#if isBeginner}
			<Alert type="info">
				<strong>File sync</strong> is like Dropbox — files stay in sync across devices.
				<strong>Versioned backup</strong> keeps old versions so you can undo mistakes or recover from ransomware.
				<strong>Both</strong> gives you the best protection.
			</Alert>
		{/if}
		<SingleSelect
			options={[
				{ value: 'sync', label: 'File sync', description: 'Mirror files across devices — like Dropbox' },
				{ value: 'versioned', label: 'Versioned backup', description: 'Keep 30-90 days of old versions' },
				{ value: 'both', label: 'Both', description: 'Sync + versioned — best protection' }
			]}
			bind:value={$assessment.backupType}
			columns={3}
		/>
		{#if isBeginner}
			<p class="mt-2 text-sm text-(--color-text-muted)">
				<RecommendedBadge show={$assessment.backupType !== 'both'} />
				"Both" is recommended if you have important documents you can't afford to lose.
			</p>
		{/if}
	</QuestionGroup>

	{#if skill !== 'beginner'}
		<QuestionGroup label="Will you work directly off the server?" description="Edit files stored on the server in real-time — video editing, development, etc.">
			<SingleSelect
				options={[
					{ value: 'heavy', label: 'Heavy editing', description: 'Video editing, large files — needs fast I/O and possibly 10GbE' },
					{ value: 'occasional', label: 'Occasional access', description: 'Open files sometimes — standard NAS speed is fine' },
					{ value: 'no', label: 'No', description: 'Just sync/backup, work on local copies' }
				]}
				bind:value={$assessment.worksOffServer}
				columns={3}
			/>
		</QuestionGroup>
	{/if}

	{#if multipleUsers}
		<QuestionGroup label="Do household members need their own file spaces?" description={isBeginner ? "Like each person having their own Google Drive — separate, private storage areas." : "Separate storage areas per user via Nextcloud."}>
			<SingleSelect
				options={[
					{ value: 'true', label: 'Yes', description: 'Each person gets private storage' },
					{ value: 'false', label: 'No', description: 'Shared folders are fine' }
				]}
				value={String($assessment.needsPersonalSpaces)}
				onchange={(v) => ($assessment.needsPersonalSpaces = v === 'true')}
				columns={2}
			/>
		</QuestionGroup>
	{/if}
</ConditionalSection>
