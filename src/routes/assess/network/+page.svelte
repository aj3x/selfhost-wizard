<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';
	import RecommendedBadge from '$lib/components/shared/RecommendedBadge.svelte';

	let skill = $derived($assessment.skillLevel);
	let isBeginner = $derived(skill === 'beginner');

	let wantsRemote = $derived($assessment.remoteAccess !== 'none');
	let needsSharing = $derived($assessment.remoteAccess === 'share');

	// Spec: show port forwarding when regular or share, and not beginner
	let showPortForwarding = $derived(
		($assessment.remoteAccess === 'regular' || $assessment.remoteAccess === 'share') &&
		skill !== 'beginner'
	);

	// Spec: show domain when not local-only
	let showDomain = $derived(wantsRemote);

	// Pre-fill VPN info from subscriptions
	let hasVPN = $derived($assessment.vpnService?.enabled === true);

	// Spec: show VPN question when automation is enabled
	let hasAutomation = $derived(
		$assessment.automationLevel === 'full' || $assessment.automationLevel === 'semi'
	);
</script>

<h1 class="mb-2 text-2xl font-bold">Network & Access</h1>
<p class="mb-8 text-(--color-text-muted)">
	How will you access your server? This determines VPN, security, and domain needs.
</p>

<QuestionGroup label="Will you access this server from outside your home?">
	<SingleSelect
		options={[
			{
				value: 'none',
				label: 'Local only',
				description: isBeginner ? "I'll only use it when I'm home on my WiFi" : "Home network only — simplest setup"
			},
			{
				value: 'occasional',
				label: 'Occasionally',
				description: isBeginner ? 'Check on things while traveling, grab a file' : 'Sometimes while traveling'
			},
			{
				value: 'regular',
				label: 'Regularly',
				description: isBeginner ? 'Stream media while away, work remotely' : 'Work remotely or travel often'
			},
			{
				value: 'share',
				label: 'Share with others',
				description: 'Friends or family outside my home need access'
			}
		]}
		bind:value={$assessment.remoteAccess}
		columns={2}
	/>
</QuestionGroup>

{#if wantsRemote && isBeginner}
	<Alert type="beginner">
		For remote access, we recommend <strong>Tailscale</strong> — it creates a secure private connection to your server
		without exposing anything to the internet. It's free for personal use and takes about 5 minutes to set up.
		<RecommendedBadge />
	</Alert>
{/if}

{#if needsSharing}
	<Alert type="info">
		Sharing with people outside your home typically needs a reverse proxy with authentication.
		{#if isBeginner}
			Don't worry — we'll walk you through setting this up. It's like giving friends a secure login page to access your services.
		{/if}
	</Alert>
{/if}

{#if hasAutomation && !hasVPN}
	<Alert type="warning">
		You selected automated media management — you'll need a VPN service to route download traffic privately.
		{#if isBeginner}
			We recommend Mullvad (~$5/month) for its simplicity and privacy. You can go back to the Subscriptions page to add one.
		{/if}
	</Alert>
{/if}

{#if showPortForwarding}
	<QuestionGroup label="Are you comfortable opening ports on your router?" description="Port forwarding lets external traffic reach your server. Not needed if using Tailscale or Cloudflare Tunnel.">
		<SingleSelect
			options={[
				{ value: 'true', label: 'Yes', description: 'I can configure my router — enables reverse proxy setup' },
				{ value: 'false', label: 'No / Not sure', description: "We'll recommend Tailscale or Cloudflare Tunnel instead" }
			]}
			value={String($assessment.comfortableWithPorts)}
			onchange={(v) => ($assessment.comfortableWithPorts = v === 'true')}
			columns={2}
		/>
	</QuestionGroup>
{/if}

{#if showDomain}
	<QuestionGroup label="Want a custom domain name?" description={isBeginner ? "This lets you use nice URLs like media.yourhome.com instead of IP addresses." : "e.g., media.yourdomain.com — requires ~$12/year for a domain."}>
		<SingleSelect
			options={[
				{
					value: 'true',
					label: 'Yes',
					description: isBeginner ? 'Nice URLs and free SSL certificates (~$12/year)' : 'Clean URLs and automatic SSL'
				},
				{
					value: 'false',
					label: 'No',
					description: isBeginner ? 'IP addresses or Tailscale names work fine' : 'IP or Tailscale magic DNS'
				}
			]}
			value={String($assessment.wantsDomain)}
			onchange={(v) => ($assessment.wantsDomain = v === 'true')}
			columns={2}
		/>
	</QuestionGroup>
{/if}

<QuestionGroup label="Network-wide ad blocking?" description={isBeginner ? "Block ads on every device in your home — phones, tablets, smart TVs — without installing anything on each device." : "Block ads at the DNS level for all devices using AdGuard Home or Pi-hole."}>
	<SingleSelect
		options={[
			{
				value: 'true',
				label: 'Yes',
				description: 'Block ads for every device on your network'
			},
			{
				value: 'false',
				label: 'No',
				description: 'Browser extensions are enough for me'
			}
		]}
		value={String($assessment.wantsAdBlocking)}
		onchange={(v) => ($assessment.wantsAdBlocking = v === 'true')}
		columns={2}
	/>
	{#if isBeginner && $assessment.wantsAdBlocking}
		<p class="mt-2 text-sm text-(--color-text-muted)">
			<RecommendedBadge />
			This is one of the easiest and most impactful things to self-host — and it uses almost no resources.
		</p>
	{/if}
</QuestionGroup>
