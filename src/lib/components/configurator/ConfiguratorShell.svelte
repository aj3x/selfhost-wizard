<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { configurator } from '$lib/stores/configurator';

	const CONFIGURATOR_STEPS = [
		{ path: '/configure/service-select', label: 'Services', shortLabel: 'Services' },
		{ path: '/configure/dependencies', label: 'Dependencies', shortLabel: 'Deps' },
		{ path: '/configure/options', label: 'Configuration', shortLabel: 'Config' },
		{ path: '/configure/paths', label: 'Paths', shortLabel: 'Paths' },
		{ path: '/configure/review', label: 'Review & Generate', shortLabel: 'Review' }
	] as const;

	let { children } = $props();

	let currentIndex = $derived(CONFIGURATOR_STEPS.findIndex((s) => page.url.pathname === s.path));
	let isFirst = $derived(currentIndex <= 0);
	let isLast = $derived(currentIndex >= CONFIGURATOR_STEPS.length - 1);
	let progress = $derived(((currentIndex + 1) / CONFIGURATOR_STEPS.length) * 100);

	let allIds = $derived([...$configurator.selectedServices, ...$configurator.resolvedDependencies]);
	let hasServices = $derived(allIds.length > 0);

	/** Steps are reachable only if prior requirements are met */
	function canReachStep(index: number): boolean {
		if (index === 0) return true;
		// All steps after service-select require at least one service
		return hasServices;
	}

	function goBack() {
		if (!isFirst) goto(CONFIGURATOR_STEPS[currentIndex - 1].path);
	}

	function goNext() {
		if (!isLast && canReachStep(currentIndex + 1)) goto(CONFIGURATOR_STEPS[currentIndex + 1].path);
	}

	function goToStep(index: number) {
		if (canReachStep(index)) goto(CONFIGURATOR_STEPS[index].path);
	}
</script>

<div class="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6">
	<header class="mb-2 flex items-center justify-between">
		<span class="text-sm text-(--color-text-muted)">
			Step {currentIndex + 1} of {CONFIGURATOR_STEPS.length}
		</span>
		<span class="text-sm font-medium" aria-live="polite">
			{currentIndex >= 0 ? CONFIGURATOR_STEPS[currentIndex].label : ''}
		</span>
	</header>

	<div class="mb-6 h-2 w-full overflow-hidden rounded-full bg-(--color-border)" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Configurator progress">
		<div
			class="h-full rounded-full bg-(--color-primary) transition-all duration-300"
			style="width: {progress}%"
		></div>
	</div>

	<nav aria-label="Configurator steps" class="mb-6">
		<ol class="flex gap-1">
			{#each CONFIGURATOR_STEPS as step, i}
				{@const reachable = canReachStep(i)}
				<li class="flex-1">
					<button
						onclick={() => goToStep(i)}
						disabled={!reachable}
						aria-current={i === currentIndex ? 'step' : undefined}
						class="w-full rounded px-1 py-1.5 text-center text-xs transition-colors
							focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)
							{i === currentIndex
							? 'bg-(--color-primary) text-white font-medium'
							: reachable && i < currentIndex
								? 'bg-(--color-primary)/10 text-(--color-primary) cursor-pointer hover:bg-(--color-primary)/20'
								: 'bg-(--color-surface-alt) text-(--color-text-muted) cursor-default opacity-50'}"
					>
						{step.shortLabel}
					</button>
				</li>
			{/each}
		</ol>
	</nav>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="mt-8 flex items-center justify-between border-t border-(--color-border) pt-4">
		<button
			onclick={goBack}
			disabled={isFirst}
			aria-label="Go to previous step"
			class="cursor-pointer rounded-lg px-6 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface-alt) disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
		>
			&larr; Back
		</button>

		{#if isLast}
			<span class="hint">Review your configuration below</span>
		{:else if !canReachStep(currentIndex + 1)}
			<span class="hint" role="status">Select at least one service to continue</span>
		{:else}
			<button
				onclick={goNext}
				aria-label="Go to next step"
				class="btn-primary"
			>
				Next &rarr;
			</button>
		{/if}
	</footer>
</div>
