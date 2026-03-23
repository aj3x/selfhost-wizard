<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
</script>

<h1 class="mb-2 text-2xl font-bold">Security & Reliability</h1>
<p class="mb-8 text-(--color-text-muted)">
	How important is your data? This shapes our backup and redundancy recommendations.
</p>

<QuestionGroup label="How critical is this data?">
	<SingleSelect
		options={[
			{ value: 'replaceable', label: 'Replaceable', description: 'Mostly media I could re-download' },
			{ value: 'important', label: 'Important', description: "I'd be upset to lose it, but it's not irreplaceable" },
			{ value: 'critical', label: 'Critical', description: 'Family photos, important documents — cannot lose' },
			{ value: 'mission_critical', label: 'Mission Critical', description: 'Business data or irreplaceable archives' }
		]}
		bind:value={$assessment.dataCriticality}
		columns={2}
	/>
</QuestionGroup>

<QuestionGroup label="Risk tolerance for data exposure">
	<SingleSelect
		options={[
			{ value: 'minimal', label: 'Minimal exposure', description: 'Local-only, VPN for remote, no public ports' },
			{ value: 'cautious', label: 'Cautious', description: 'Reverse proxy with auth, no direct exposure' },
			{ value: 'standard', label: 'Standard', description: 'Reverse proxy, SSL, reasonable security' },
			{ value: 'advanced', label: 'Advanced', description: "I'll manage my own firewall rules and security" }
		]}
		bind:value={$assessment.riskTolerance}
		columns={2}
	/>
</QuestionGroup>

<QuestionGroup label="Off-site backup?">
	<SingleSelect
		options={[
			{ value: 'cloud', label: 'Cloud backup', description: 'Backblaze B2, ~$5/TB/month — most reliable' },
			{ value: 'own_location', label: 'Own location', description: "Friend's house, office, safe deposit box" },
			{ value: 'no', label: 'No', description: "I'll risk it — local only" }
		]}
		bind:value={$assessment.wantsOffsiteBackup}
		columns={3}
	/>
</QuestionGroup>

<QuestionGroup label="UPS (battery backup)?">
	<SingleSelect
		options={[
			{
				value: 'true',
				label: 'Yes',
				description: 'Protects against power outages and data corruption ($60-150)'
			},
			{
				value: 'false',
				label: 'No',
				description: "I'll accept the risk of sudden power loss"
			}
		]}
		value={String($assessment.wantsUPS)}
		onchange={(v) => ($assessment.wantsUPS = v === 'true')}
		columns={2}
	/>
</QuestionGroup>
