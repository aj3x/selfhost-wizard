<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
</script>

<h1 class="mb-2 text-2xl font-bold">Network & Access</h1>
<p class="mb-8 text-(--color-text-muted)">
	How will you access your server? This determines VPN, reverse proxy, and domain needs.
</p>

<QuestionGroup label="Remote access needs">
	<SingleSelect
		options={[
			{ value: 'none', label: 'Local only', description: "I'll only use it on my home network" },
			{ value: 'occasional', label: 'Occasional remote', description: 'Sometimes while traveling' },
			{ value: 'regular', label: 'Regular remote', description: 'I work remotely or travel often' },
			{ value: 'share', label: 'Share with others', description: 'Friends/family outside my home' }
		]}
		bind:value={$assessment.remoteAccess}
		columns={2}
	/>
</QuestionGroup>

<ConditionalSection visible={$assessment.remoteAccess !== 'none'}>
	{#if $assessment.skillLevel !== 'beginner'}
		<QuestionGroup label="Comfortable with port forwarding?">
			<SingleSelect
				options={[
					{ value: 'true', label: 'Yes', description: 'I can configure my router' },
					{ value: 'false', label: 'No / Not sure', description: "We'll recommend Tailscale (simpler)" }
				]}
				value={String($assessment.comfortableWithPorts)}
				onchange={(v) => ($assessment.comfortableWithPorts = v === 'true')}
				columns={2}
			/>
		</QuestionGroup>
	{/if}

	<QuestionGroup label="Want a custom domain?" description="e.g., media.yourdomain.com — requires ~$12/year for a domain.">
		<SingleSelect
			options={[
				{ value: 'true', label: 'Yes', description: 'Clean URLs and SSL certificates' },
				{ value: 'false', label: 'No', description: 'IP addresses or Tailscale names are fine' }
			]}
			value={String($assessment.wantsDomain)}
			onchange={(v) => ($assessment.wantsDomain = v === 'true')}
			columns={2}
		/>
	</QuestionGroup>
</ConditionalSection>

<QuestionGroup label="Network-wide ad blocking?" description="Block ads on all devices using AdGuard Home or Pi-hole.">
	<SingleSelect
		options={[
			{ value: 'true', label: 'Yes', description: 'Block ads at the DNS level for all devices' },
			{ value: 'false', label: 'No', description: 'Browser extensions are enough' }
		]}
		value={String($assessment.wantsAdBlocking)}
		onchange={(v) => ($assessment.wantsAdBlocking = v === 'true')}
		columns={2}
	/>
</QuestionGroup>
