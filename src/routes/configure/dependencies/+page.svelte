<script lang="ts">
	import { configurator } from '$lib/stores/configurator';
	import { findService } from '$lib/services/registry';
	import {
		findUnmetDependencies,
		findConflicts,
		getRecommendations,
		detectPortConflicts
	} from '$lib/calc/dependencies';

	let allIds = $derived([...$configurator.selectedServices, ...$configurator.resolvedDependencies]);
	let unmet = $derived(findUnmetDependencies(allIds));
	let conflicts = $derived(findConflicts(allIds));
	let portConflicts = $derived(detectPortConflicts(allIds));
	let recommendations = $derived(getRecommendations(allIds));

	let hasIssues = $derived(unmet.length > 0 || conflicts.length > 0);

	function removeService(id: string) {
		configurator.toggleService(id);
	}

	function addRecommended(id: string) {
		configurator.toggleService(id);
	}
</script>

<svelte:head>
	<title>Dependencies — SelfHost Wizard</title>
</svelte:head>

<div>
	<h1 class="mb-2 text-2xl font-bold">Dependency Resolution</h1>
	<p class="mb-6 text-(--color-text-muted)">
		We've checked your selection for missing dependencies and conflicts.
	</p>

	{#if allIds.length === 0}
		<div class="rounded-xl border border-(--color-border) p-8 text-center text-(--color-text-muted)">
			<p class="text-lg font-medium">No services selected</p>
			<p class="mt-1 text-sm">Go back to select some services first.</p>
		</div>
	{:else}

	<!-- Resolved dependencies -->
	{#if $configurator.resolvedDependencies.length > 0}
		<div class="mb-6 rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/5 p-4">
			<h2 class="mb-2 text-sm font-semibold text-(--color-primary)">Auto-added Dependencies</h2>
			<p class="mb-3 text-sm text-(--color-text-muted)">
				These services were added because other services require them.
			</p>
			<div class="flex flex-wrap gap-2">
				{#each $configurator.resolvedDependencies as id}
					{@const svc = findService(id)}
					{#if svc}
						<span class="rounded-lg bg-(--color-primary)/10 px-3 py-1.5 text-sm text-(--color-primary)">
							{svc.name}
						</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Remaining unmet dependencies -->
	{#if unmet.length > 0}
		<div class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
			<h2 class="mb-2 text-sm font-semibold text-amber-600">Unmet Dependencies</h2>
			{#each unmet as dep}
				{@const svc = findService(dep.serviceId)}
				<div class="mb-2 text-sm">
					<strong>{svc?.name}</strong> requires
					{#if dep.rule.type === 'one_of'}
						{dep.rule.label}:
						<div class="mt-1 flex flex-wrap gap-2">
							{#each dep.rule.serviceIds as optionId}
								{@const opt = findService(optionId)}
								{#if opt}
									<button
										onclick={() => {
											configurator.toggleService(optionId);
											if (dep.rule.type === 'one_of') {
												configurator.setDependencyChoice(`${dep.serviceId}:${dep.rule.label}`, optionId);
											}
										}}
										class="cursor-pointer rounded-lg border border-(--color-border) px-3 py-1 text-sm transition-colors hover:border-(--color-primary) hover:bg-(--color-primary)/5"
									>
										{opt.name}
										{#if dep.rule.type === 'one_of' && dep.rule.defaultId === optionId}
											<span class="text-xs text-(--color-text-muted)">(recommended)</span>
										{/if}
									</button>
								{/if}
							{/each}
						</div>
					{:else}
						{dep.rule.serviceIds.map((id) => findService(id)?.name || id).join(', ')}
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Conflicts -->
	{#if conflicts.length > 0}
		<div class="mb-6 rounded-xl border border-(--color-danger)/30 bg-(--color-danger)/5 p-4">
			<h2 class="mb-2 text-sm font-semibold text-(--color-danger)">Conflicts</h2>
			{#each conflicts as conflict}
				{@const a = findService(conflict.serviceA)}
				{@const b = findService(conflict.serviceB)}
				<div class="mb-3 text-sm">
					<p><strong>{a?.name}</strong> and <strong>{b?.name}</strong> serve the same purpose — pick one:</p>
					{#if a?.conflictReason || b?.conflictReason}
						<div class="mt-1 space-y-0.5 text-xs text-(--color-text-muted)">
							{#if a?.conflictReason}<p>{a.name}: {a.conflictReason}</p>{/if}
							{#if b?.conflictReason}<p>{b.name}: {b.conflictReason}</p>{/if}
						</div>
					{/if}
					<div class="mt-2 flex gap-2">
						<button
							onclick={() => removeService(conflict.serviceB)}
							class="cursor-pointer rounded-lg border border-(--color-border) px-3 py-1.5 text-sm transition-colors hover:border-(--color-primary) hover:bg-(--color-primary)/5"
						>
							Keep {a?.name}
						</button>
						<button
							onclick={() => removeService(conflict.serviceA)}
							class="cursor-pointer rounded-lg border border-(--color-border) px-3 py-1.5 text-sm transition-colors hover:border-(--color-primary) hover:bg-(--color-primary)/5"
						>
							Keep {b?.name}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Port conflicts -->
	{#if portConflicts.length > 0}
		<div class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
			<h2 class="mb-2 text-sm font-semibold text-amber-600">Port Conflicts</h2>
			{#each portConflicts as pc}
				<p class="text-sm">
					Port <strong>{pc.port}/{pc.protocol}</strong> is used by
					{pc.services.map((id) => findService(id)?.name || id).join(' and ')}.
					One service will need its port remapped.
				</p>
			{/each}
		</div>
	{/if}

	<!-- All good -->
	{#if !hasIssues && portConflicts.length === 0}
		<div class="mb-6 rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
			<p class="text-sm font-medium text-green-600">All dependencies satisfied. No conflicts detected.</p>
		</div>
	{/if}

	<!-- Recommendations -->
	{#if recommendations.length > 0}
		<div class="mb-6 rounded-xl border border-(--color-border) p-4">
			<h2 class="mb-2 text-sm font-semibold">Recommended Additions</h2>
			<p class="mb-3 text-xs text-(--color-text-muted)">
				These services work well with your current selection.
			</p>
			<div class="flex flex-wrap gap-2">
				{#each recommendations as rec}
					<button
						onclick={() => addRecommended(rec.recommendedId)}
						class="cursor-pointer rounded-lg border border-dashed border-(--color-border) px-3 py-1.5 text-sm transition-colors hover:border-(--color-primary) hover:bg-(--color-primary)/5"
					>
						+ {rec.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Summary -->
	<div class="rounded-xl border border-(--color-border) p-4">
		<h2 class="mb-3 text-sm font-semibold">Selected Services ({allIds.length})</h2>
		<div class="flex flex-wrap gap-2">
			{#each allIds as id}
				{@const svc = findService(id)}
				{@const isResolved = $configurator.resolvedDependencies.includes(id)}
				{#if svc}
					<span class="rounded-lg px-3 py-1.5 text-sm
						{isResolved
							? 'bg-(--color-primary)/10 text-(--color-primary)'
							: 'bg-(--color-surface-alt) text-(--color-text)'}">
						{svc.name}
					</span>
				{/if}
			{/each}
		</div>
	</div>

	{/if}
</div>
