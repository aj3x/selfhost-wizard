<script lang="ts">
	import { configurator } from '$lib/stores/configurator';
	import { findService } from '$lib/services/registry';
	import { VPN_PROVIDERS, type VpnProvider, type VpnType } from '$lib/types/configurator';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';

	let allIds = $derived([...$configurator.selectedServices, ...$configurator.resolvedDependencies]);
	let gc = $derived($configurator.globalConfig);

	let hasGluetun = $derived(allIds.includes('gluetun'));
	let hasPlex = $derived(allIds.includes('plex'));
	let hasTailscale = $derived(allIds.includes('tailscale'));
	let hasImmich = $derived(allIds.includes('immich'));
	let hasReverseProxy = $derived(allIds.some((id) => ['caddy', 'traefik', 'nginx-proxy-manager'].includes(id)));
	let hasGpuService = $derived(allIds.some((id) => ['jellyfin', 'plex', 'tdarr'].includes(id)));

	let selectedProvider = $derived(
		VPN_PROVIDERS.find((p) => p.id === gc.vpnProvider) || null
	);
</script>

<svelte:head>
	<title>Configuration — SelfHost Wizard</title>
</svelte:head>

<div>
	<h1 class="mb-2 text-2xl font-bold">Configuration</h1>
	<p class="mb-6 text-(--color-text-muted)">
		Set up global settings and service-specific options.
	</p>

	<!-- Global Settings -->
	<div class="mb-6 rounded-xl border border-(--color-border) p-4">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">System</h2>
		<div class="space-y-3">
			<div class="flex items-center gap-3">
				<span class="min-w-[140px] text-sm">PUID</span>
				<NumberInput
					value={gc.puid}
					onchange={(v) => configurator.updateGlobalConfig({ puid: v })}
					min={0} max={65534} step={1}
				/>
			</div>
			<div class="flex items-center gap-3">
				<span class="min-w-[140px] text-sm">PGID</span>
				<NumberInput
					value={gc.pgid}
					onchange={(v) => configurator.updateGlobalConfig({ pgid: v })}
					min={0} max={65534} step={1}
				/>
			</div>
			<div class="flex items-center gap-3">
				<span class="min-w-[140px] text-sm">Timezone</span>
				<input
					type="text"
					value={gc.tz}
					oninput={(e) => configurator.updateGlobalConfig({ tz: e.currentTarget.value })}
					class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm"
					placeholder="America/New_York"
				/>
			</div>
			<div class="flex items-center gap-3">
				<span class="min-w-[140px] text-sm">Hostname</span>
				<input
					type="text"
					value={gc.hostname}
					oninput={(e) => configurator.updateGlobalConfig({ hostname: e.currentTarget.value })}
					class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm"
					placeholder="homeserver"
				/>
			</div>
		</div>
	</div>

	<!-- GPU Transcoding -->
	{#if hasGpuService}
		<div class="mb-6 rounded-xl border border-(--color-border) p-4">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">GPU Transcoding</h2>
			<label class="flex cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					checked={$configurator.serviceEnv['global']?.GPU_TRANSCODING === 'true'}
					onchange={(e) => configurator.setServiceEnv('global', 'GPU_TRANSCODING', e.currentTarget.checked ? 'true' : 'false')}
					class="h-4 w-4 accent-(--color-primary)"
				/>
				<span class="text-sm">Enable Intel QuickSync / GPU passthrough</span>
			</label>
			<p class="mt-1 text-xs text-(--color-text-muted)">
				Adds <code class="rounded bg-(--color-surface-alt) px-1">/dev/dri</code> device passthrough for hardware transcoding. Works with most Intel integrated GPUs.
			</p>
		</div>
	{/if}

	<!-- VPN Settings -->
	{#if hasGluetun}
		<div class="mb-6 rounded-xl border border-(--color-border) p-4">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">VPN Provider</h2>
			<div class="space-y-3">
				{#each VPN_PROVIDERS as provider}
					<button
						onclick={() => configurator.updateGlobalConfig({ vpnProvider: provider.id, vpnType: provider.defaultType })}
						class="flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors
							{gc.vpnProvider === provider.id
								? 'border-(--color-primary) bg-(--color-primary)/5'
								: 'border-(--color-border) hover:border-(--color-primary)/40'}"
					>
						<div class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border
							{gc.vpnProvider === provider.id ? 'border-(--color-primary) bg-(--color-primary)' : 'border-(--color-border)'}">
							{#if gc.vpnProvider === provider.id}
								<div class="h-2 w-2 rounded-full bg-white"></div>
							{/if}
						</div>
						<div>
							<span class="text-sm font-medium">{provider.name}</span>
							{#if provider.recommended}
								<span class="ml-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">Recommended</span>
							{/if}
							<span class="ml-2 text-xs text-(--color-text-muted)">{provider.monthlyCost}</span>
							<p class="text-xs text-(--color-text-muted)">{provider.description}</p>
						</div>
					</button>
				{/each}

				{#if selectedProvider}
					<div class="mt-4 space-y-3 border-t border-(--color-border) pt-4">
						<h3 class="text-sm font-medium">
							{selectedProvider.name} Credentials
						</h3>
						{#each selectedProvider.envVars as envVar}
							<div class="flex items-center gap-3">
								<span class="min-w-[180px] text-sm">{envVar.description || envVar.key}</span>
								<input
									type={envVar.secret ? 'password' : 'text'}
									value={gc.vpnEnv[envVar.key] || ''}
									oninput={(e) => {
										const newEnv = { ...gc.vpnEnv, [envVar.key]: e.currentTarget.value };
										configurator.setVpnEnv(newEnv);
									}}
									class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
									placeholder={envVar.key}
								/>
							</div>
						{/each}
						{#if selectedProvider.supportsPortForwarding}
							<p class="text-xs text-(--color-text-muted)">
								This provider supports VPN port forwarding, which improves torrent performance.
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Plex Claim -->
	{#if hasPlex}
		<div class="mb-6 rounded-xl border border-(--color-border) p-4">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Plex</h2>
			<div class="flex items-center gap-3">
				<span class="min-w-[140px] text-sm">Claim Token</span>
				<input
					type="text"
					value={$configurator.serviceEnv['plex']?.PLEX_CLAIM || ''}
					oninput={(e) => configurator.setServiceEnv('plex', 'PLEX_CLAIM', e.currentTarget.value)}
					class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
					placeholder="claim-xxxxxxxxxxxxxxxxxxxx"
				/>
			</div>
			<p class="mt-1 text-xs text-(--color-text-muted)">
				Optional. Get one at plex.tv/claim — valid for 4 minutes.
			</p>
		</div>
	{/if}

	<!-- Tailscale -->
	{#if hasTailscale}
		<div class="mb-6 rounded-xl border border-(--color-border) p-4">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Tailscale</h2>
			<div class="flex items-center gap-3">
				<span class="min-w-[140px] text-sm">Auth Key</span>
				<input
					type="password"
					value={$configurator.serviceEnv['tailscale']?.TS_AUTHKEY || ''}
					oninput={(e) => configurator.setServiceEnv('tailscale', 'TS_AUTHKEY', e.currentTarget.value)}
					class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm"
					placeholder="tskey-auth-xxxx"
				/>
			</div>
			<p class="mt-1 text-xs text-(--color-text-muted)">
				Generate at login.tailscale.com/admin/settings/keys. You can also add this later.
			</p>
		</div>
	{/if}

	<!-- Reverse Proxy Domain -->
	{#if hasReverseProxy}
		<div class="mb-6 rounded-xl border border-(--color-border) p-4">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">Domain</h2>
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<span class="min-w-[140px] text-sm">Domain</span>
					<input
						type="text"
						value={gc.domain}
						oninput={(e) => configurator.updateGlobalConfig({ domain: e.currentTarget.value })}
						class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm"
						placeholder="home.example.com"
					/>
				</div>
				{#if gc.domain}
					<div class="flex items-center gap-3">
						<span class="min-w-[140px] text-sm">Email (for SSL)</span>
						<input
							type="email"
							value={gc.email}
							oninput={(e) => configurator.updateGlobalConfig({ email: e.currentTarget.value })}
							class="flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm"
							placeholder="you@example.com"
						/>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if allIds.length === 0}
		<div class="rounded-xl border border-(--color-border) p-8 text-center text-(--color-text-muted)">
			<p>No services selected. Go back to select some services first.</p>
		</div>
	{/if}
</div>
