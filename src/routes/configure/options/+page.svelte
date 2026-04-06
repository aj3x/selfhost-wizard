<script lang="ts">
	import { configurator } from '$lib/stores/configurator';
	import { assessment } from '$lib/stores/assessment';
	import { findService } from '$lib/services/registry';
	import { VPN_PROVIDERS, type VpnProvider, type VpnType } from '$lib/types/configurator';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';

	let allIds = $derived([...$configurator.selectedServices, ...$configurator.resolvedDependencies]);
	let gc = $derived($configurator.globalConfig);
	let skillLevel = $derived($assessment.skillLevel);
	let isBeginner = $derived(skillLevel === 'beginner');

	let hasGluetun = $derived(allIds.includes('gluetun'));
	let hasPlex = $derived(allIds.includes('plex'));
	let hasTailscale = $derived(allIds.includes('tailscale'));
	let hasImmich = $derived(allIds.includes('immich'));
	let hasReverseProxy = $derived(allIds.some((id) => ['caddy', 'nginx-proxy-manager'].includes(id)));
	let hasGpuService = $derived(allIds.some((id) => ['jellyfin', 'plex', 'tdarr'].includes(id)));

	let selectedProvider = $derived(
		VPN_PROVIDERS.find((p) => p.id === gc.vpnProvider) || null
	);

	let advancedDefault = $derived(skillLevel !== 'beginner');
	let advancedOverride = $state<boolean | null>(null);
	let showAdvancedFinal = $derived(advancedOverride !== null ? advancedOverride : advancedDefault);

	// Collect per-service env vars that need user input
	let serviceEnvSections = $derived.by(() => {
		const skipKeys = new Set(['PUID', 'PGID', 'TZ', 'PLEX_CLAIM', 'TS_AUTHKEY']);
		const sections: { serviceId: string; serviceName: string; vars: { key: string; description: string; secret: boolean; value: string }[] }[] = [];

		for (const id of allIds) {
			const svc = findService(id);
			if (!svc) continue;
			const vars = svc.environment
				.filter((e) => !skipKeys.has(e.key) && !e.value) // only user-provided vars (no static defaults)
				.map((e) => ({
					key: e.key,
					description: e.description || e.key,
					secret: e.secret || false,
					value: $configurator.serviceEnv[id]?.[e.key] || ''
				}));
			if (vars.length > 0) {
				sections.push({ serviceId: id, serviceName: svc.name, vars });
			}
		}
		return sections;
	});
</script>

<svelte:head>
	<title>Configuration — SelfHost Wizard</title>
</svelte:head>

<div>
	<h1 class="mb-2 text-2xl font-bold">Configuration</h1>
	<p class="mb-6 text-(--color-text-muted)">
		Set up global settings and service-specific options.
	</p>

	{#if allIds.length === 0}
		<div class="card p-8 text-center text-(--color-text-muted)">
			<p class="text-lg font-medium">No services selected</p>
			<p class="mt-1 text-sm">Go back to select some services first.</p>
		</div>
	{:else}

	<fieldset class="card">
		<legend class="section-heading">System</legend>
		<div class="flex items-center justify-end">
			{#if isBeginner}
				<button
					onclick={() => (advancedOverride = !showAdvancedFinal)}
					class="cursor-pointer text-xs text-(--color-primary) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
				>
					{showAdvancedFinal ? 'Hide advanced' : 'Show advanced'}
				</button>
			{/if}
		</div>
		<div class="space-y-3">
			<div class="field-row">
				<label for="field-tz" class="field-label">Timezone</label>
				<input
					id="field-tz"
					type="text"
					value={gc.tz}
					oninput={(e) => configurator.updateGlobalConfig({ tz: e.currentTarget.value })}
					class="input"
					placeholder="America/New_York"
				/>
			</div>
			<div class="field-row">
				<label for="field-hostname" class="field-label">Hostname</label>
				<input
					id="field-hostname"
					type="text"
					value={gc.hostname}
					oninput={(e) => configurator.updateGlobalConfig({ hostname: e.currentTarget.value })}
					class="input"
					placeholder="homeserver"
				/>
			</div>
			{#if showAdvancedFinal}
				<div class="field-row">
					<label for="field-puid" class="field-label">PUID</label>
					<NumberInput
						value={gc.puid}
						onchange={(v) => configurator.updateGlobalConfig({ puid: v })}
						min={0} max={65534} step={1}
					/>
					<span class="hint">User ID for file permissions</span>
				</div>
				<div class="field-row">
					<label for="field-pgid" class="field-label">PGID</label>
					<NumberInput
						value={gc.pgid}
						onchange={(v) => configurator.updateGlobalConfig({ pgid: v })}
						min={0} max={65534} step={1}
					/>
					<span class="hint">Group ID for file permissions</span>
				</div>
			{/if}
		</div>
		{#if isBeginner && !showAdvancedFinal}
			<p class="mt-3 hint">
				Defaults are fine for most setups. Click "Show advanced" if you know your user/group IDs differ.
			</p>
		{/if}
	</fieldset>

	{#if hasGpuService}
		<fieldset class="card">
			<legend class="section-heading">GPU Transcoding</legend>
			<label class="flex cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					checked={$configurator.serviceEnv['global']?.GPU_TRANSCODING === 'true'}
					onchange={(e) => configurator.setServiceEnv('global', 'GPU_TRANSCODING', e.currentTarget.checked ? 'true' : 'false')}
					class="h-4 w-4 accent-(--color-primary)"
				/>
				<span class="text-sm">Enable Intel QuickSync / GPU passthrough</span>
			</label>
			<p class="mt-1 hint">
				Adds <code class="rounded bg-(--color-surface-alt) px-1">/dev/dri</code> device passthrough for hardware transcoding. Works with most Intel integrated GPUs.
			</p>
		</fieldset>
	{/if}

	{#if hasGluetun}
		<fieldset class="card">
			<legend class="section-heading">VPN Provider</legend>
			<div class="space-y-3" role="radiogroup" aria-label="VPN provider selection">
				{#each VPN_PROVIDERS as provider}
					<button
						onclick={() => configurator.updateGlobalConfig({ vpnProvider: provider.id, vpnType: provider.defaultType })}
						role="radio"
						aria-checked={gc.vpnProvider === provider.id}
						class="flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors
							focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)
							{gc.vpnProvider === provider.id
								? 'border-(--color-primary) bg-(--color-primary)/5'
								: 'border-(--color-border) hover:border-(--color-primary)/40'}"
					>
						<div aria-hidden="true" class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border
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
							<span class="ml-2 hint">{provider.monthlyCost}</span>
							<p class="hint">{provider.description}</p>
						</div>
					</button>
				{/each}

				{#if selectedProvider}
					<div class="mt-4 space-y-3 border-t border-(--color-border) pt-4">
						<h3 class="text-sm font-medium">
							{selectedProvider.name} Credentials
						</h3>
						{#if selectedProvider.id == "custom"}
							<p class="hint">
								For custom VPN providers, see the <a href="https://github.com/qdm12/gluetun-wiki/tree/main/setup/providers" target="_blank" rel="noopener noreferrer" class="text-(--color-primary) underline">Gluetun custom VPN setup instructions</a> to determine which credentials and environment variables you need to fill in below.
							</p>
						{/if}
						{#each selectedProvider.envVars as envVar}
							<div class="field-row">
								<label for="vpn-{envVar.key}" class="min-w-[180px] text-sm">{envVar.description || envVar.key}</label>
								<input
									id="vpn-{envVar.key}"
									type={envVar.secret ? 'password' : 'text'}
									value={gc.vpnEnv[envVar.key] || ''}
									oninput={(e) => {
										const newEnv = { ...gc.vpnEnv, [envVar.key]: e.currentTarget.value };
										configurator.setVpnEnv(newEnv);
									}}
									class="input-mono"
									placeholder={envVar.key}
								/>
							</div>
						{/each}

						<div class="field-row">
							<label for="vpn-country" class="min-w-[180px] text-sm">Server Country</label>
							<input
								id="vpn-country"
								type="text"
								value={gc.vpnCountry}
								oninput={(e) => configurator.updateGlobalConfig({ vpnCountry: e.currentTarget.value })}
								class="input"
								placeholder="e.g. Switzerland, US New York"
							/>
						</div>
						<p class="hint">
							Optional. Leave blank for auto-selection. Format depends on your VPN provider.
						</p>

						{#if selectedProvider.supportsPortForwarding}
							<p class="hint">
								This provider supports VPN port forwarding, which improves torrent performance.
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</fieldset>
	{/if}

	{#if hasPlex}
		<fieldset class="card">
			<legend class="section-heading">Plex</legend>
			<div class="field-row">
				<label for="plex-claim" class="field-label">Claim Token</label>
				<input
					id="plex-claim"
					type="text"
					value={$configurator.serviceEnv['plex']?.PLEX_CLAIM || ''}
					oninput={(e) => configurator.setServiceEnv('plex', 'PLEX_CLAIM', e.currentTarget.value)}
					class="input-mono"
					placeholder="claim-xxxxxxxxxxxxxxxxxxxx"
				/>
			</div>
			<p class="mt-1 hint">
				Optional. Get one at plex.tv/claim — valid for 4 minutes.
			</p>
		</fieldset>
	{/if}

	{#if hasTailscale}
		<fieldset class="card">
			<legend class="section-heading">Tailscale</legend>
			<div class="field-row">
				<label for="ts-authkey" class="field-label">Auth Key</label>
				<input
					id="ts-authkey"
					type="password"
					value={$configurator.serviceEnv['tailscale']?.TS_AUTHKEY || ''}
					oninput={(e) => configurator.setServiceEnv('tailscale', 'TS_AUTHKEY', e.currentTarget.value)}
					class="input-mono"
					placeholder="tskey-auth-xxxx"
				/>
			</div>
			<p class="mt-1 hint">
				Generate at login.tailscale.com/admin/settings/keys. You can also add this later.
			</p>
		</fieldset>
	{/if}

	{#if serviceEnvSections.length > 0}
		<fieldset class="card">
			<legend class="section-heading">Service Settings</legend>
			<div class="space-y-4">
				{#each serviceEnvSections as section}
					<div>
						<h3 class="mb-2 text-sm font-medium">{section.serviceName}</h3>
						<div class="space-y-2">
							{#each section.vars as envVar}
								<div class="field-row">
									<label for="svc-{section.serviceId}-{envVar.key}" class="min-w-[180px] text-sm">{envVar.description}</label>
									<input
										id="svc-{section.serviceId}-{envVar.key}"
										type={envVar.secret ? 'password' : 'text'}
										value={envVar.value}
										oninput={(e) => configurator.setServiceEnv(section.serviceId, envVar.key, e.currentTarget.value)}
										class="input-mono"
										placeholder={envVar.secret ? '(auto-generated if empty)' : envVar.key}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</fieldset>
	{/if}

	{#if hasReverseProxy}
		<fieldset class="card">
			<legend class="section-heading">Domain</legend>
			<div class="space-y-3">
				<div class="field-row">
					<label for="field-domain" class="field-label">Domain</label>
					<input
						id="field-domain"
						type="text"
						value={gc.domain}
						oninput={(e) => configurator.updateGlobalConfig({ domain: e.currentTarget.value })}
						class="input"
						placeholder="home.example.com"
					/>
				</div>
				{#if gc.domain}
					<div class="field-row">
						<label for="field-email" class="field-label">Email (for SSL)</label>
						<input
							id="field-email"
							type="email"
							value={gc.email}
							oninput={(e) => configurator.updateGlobalConfig({ email: e.currentTarget.value })}
							class="input"
							placeholder="you@example.com"
						/>
					</div>
				{/if}
			</div>
		</fieldset>
	{/if}

	{/if}
</div>
