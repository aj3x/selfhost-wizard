<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';
	import RecommendedBadge from '$lib/components/shared/RecommendedBadge.svelte';

	let skill = $derived($assessment.skillLevel);
	let isBeginner = $derived(skill === 'beginner');

	// Spec: show off-site backup when data is important, critical, or mission-critical
	let showOffsiteBackup = $derived(
		$assessment.dataCriticality !== 'replaceable'
	);

	// Skip UPS question if user already has one from hardware screen
	let alreadyHasUPS = $derived($assessment.byod.hasUPS);

	// Recommend off-site based on criticality
	let recommendOffsite = $derived(
		$assessment.dataCriticality === 'critical' || $assessment.dataCriticality === 'mission_critical'
	);
</script>

<h1 class="mb-2 text-2xl font-bold">Security & Reliability</h1>
<p class="mb-8 text-(--color-text-muted)">
	How important is your data? This shapes our backup and redundancy recommendations.
</p>

<QuestionGroup label="How critical is your data?">
	{#if isBeginner}
		<p class="mb-3 text-sm text-(--color-text-muted)">
			Think about what would happen if your server's hard drive died tomorrow. How bad would that be?
		</p>
	{/if}
	<SingleSelect
		options={[
			{
				value: 'replaceable',
				label: 'Replaceable',
				description: isBeginner
					? "Mostly stuff I could re-download. I'd be annoyed but not devastated."
					: 'Mostly media I could re-download'
			},
			{
				value: 'important',
				label: 'Important',
				description: isBeginner
					? "I have family photos and documents I'd hate to lose, but my media library could be rebuilt."
					: "I'd be upset to lose it, but it's not irreplaceable"
			},
			{
				value: 'critical',
				label: 'Critical',
				description: isBeginner
					? 'Photos spanning years, important documents — losing this would be devastating.'
					: 'Family photos, important documents — cannot lose'
			},
			{
				value: 'mission_critical',
				label: 'Mission Critical',
				description: isBeginner
					? 'This is also my work. Downtime costs me money.'
					: 'Business data, irreplaceable archives, downtime = lost money'
			}
		]}
		bind:value={$assessment.dataCriticality}
		columns={2}
	/>
</QuestionGroup>

{#if isBeginner && $assessment.dataCriticality !== 'replaceable'}
	<Alert type="beginner">
		<strong>Important:</strong> RAID (using multiple drives for redundancy) protects against a single drive dying,
		but it's <em>not a backup</em>. It won't protect against ransomware, accidental deletion, fire, or theft.
		For truly important data, you need copies in at least two physically separate places.
		<br/><br/>
		If your photos are on your phone AND on your server, that counts as a backup. But if you delete them
		from your phone and they only live on the server, you don't have a backup of those photos.
	</Alert>
{/if}

<QuestionGroup label="How much internet exposure are you comfortable with?">
	{#if isBeginner}
		<p class="mb-3 text-sm text-(--color-text-muted)">
			Self-hosting means your data lives on hardware you control — more private than cloud services,
			but you're responsible for security. How cautious do you want to be?
		</p>
	{/if}
	<SingleSelect
		options={[
			{
				value: 'minimal',
				label: 'Minimal',
				description: isBeginner
					? 'Nothing visible from the internet. VPN to connect remotely.'
					: 'Local only + VPN for remote access, no public ports'
			},
			{
				value: 'cautious',
				label: 'Cautious',
				description: isBeginner
					? 'Some services available remotely, but with strong login protection.'
					: 'Reverse proxy with auth, no direct exposure'
			},
			{
				value: 'standard',
				label: 'Standard',
				description: isBeginner
					? 'Standard security practices — SSL, passwords, firewall.'
					: 'Reverse proxy, SSL, reasonable security'
			},
			{
				value: 'advanced',
				label: 'I\'ll handle it',
				description: "Full control, I'll manage my own security"
			}
		]}
		bind:value={$assessment.riskTolerance}
		columns={2}
	/>
	{#if isBeginner}
		<p class="mt-2 text-sm text-(--color-text-muted)">
			<RecommendedBadge show={$assessment.riskTolerance !== 'cautious'} />
			"Cautious" is a good default — secure but still convenient.
		</p>
	{/if}
</QuestionGroup>

{#if showOffsiteBackup}
	<QuestionGroup label="Off-site backup?" description={isBeginner ? "A copy of your important data stored somewhere else — protects against fire, flood, or theft." : "Protects against physical disasters — fire, flood, theft."}>
		<SingleSelect
			options={[
				{
					value: 'cloud',
					label: 'Cloud backup',
					description: isBeginner
						? 'Automatic upload to Backblaze B2 (~$5/TB/month) — most reliable'
						: 'Backblaze B2 / Wasabi — ~$5/TB/month'
				},
				{
					value: 'own_location',
					label: 'Another location',
					description: isBeginner
						? "A drive at a friend's house, family member, or office"
						: "Friend/family's house, second property — via Syncthing or rsync"
				},
				{
					value: 'no',
					label: 'No off-site backup',
					description: 'Local only — I accept the risk'
				}
			]}
			bind:value={$assessment.wantsOffsiteBackup}
			columns={isBeginner ? 1 : 3}
		/>
		{#if recommendOffsite && $assessment.wantsOffsiteBackup === 'no'}
			<Alert type="warning">
				You marked your data as {$assessment.dataCriticality === 'mission_critical' ? 'mission critical' : 'critical'} —
				we strongly recommend some form of off-site backup. Even a selective backup of just photos and documents
				is much better than nothing.
			</Alert>
		{/if}
		{#if isBeginner && $assessment.wantsOffsiteBackup === 'cloud'}
			<p class="mt-2 text-sm text-(--color-text-muted)">
				<RecommendedBadge />
				Cloud backup is the most reliable option. You can choose to back up only your most important data
				(photos, documents) to keep costs low.
			</p>
		{/if}
	</QuestionGroup>
{/if}

{#if !alreadyHasUPS}
	<QuestionGroup label="UPS (battery backup)?">
		{#if isBeginner}
			<p class="mb-2 text-sm text-(--color-text-muted)">
				A UPS is like a big battery for your server. It keeps things running during short power outages
				and gives the server time to shut down safely during longer ones. This prevents data corruption.
			</p>
		{/if}
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
		{#if isBeginner}
			<p class="mt-2 text-sm text-(--color-text-muted)">
				<RecommendedBadge show={!$assessment.wantsUPS} />
				Recommended if you're storing important data, especially with RAID drives.
			</p>
		{/if}
	</QuestionGroup>
{:else}
	<div class="my-4 rounded-lg bg-(--color-success)/10 border border-(--color-success)/30 p-3 text-sm">
		You already have a UPS from your existing hardware — great!
	</div>
{/if}
