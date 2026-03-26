<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

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

	function goBack() {
		if (!isFirst) {
			goto(CONFIGURATOR_STEPS[currentIndex - 1].path);
		}
	}

	function goNext() {
		if (!isLast) {
			goto(CONFIGURATOR_STEPS[currentIndex + 1].path);
		}
	}
</script>

<div class="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6">
	<!-- Top bar -->
	<div class="mb-2 flex items-center justify-between">
		<span class="text-sm text-(--color-text-muted)">
			Step {currentIndex + 1} of {CONFIGURATOR_STEPS.length}
		</span>
		<span class="text-sm font-medium">
			{currentIndex >= 0 ? CONFIGURATOR_STEPS[currentIndex].label : ''}
		</span>
	</div>

	<div class="mb-6 h-2 w-full overflow-hidden rounded-full bg-(--color-border)">
		<div
			class="h-full rounded-full bg-(--color-primary) transition-all duration-300"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Step indicators -->
	<div class="mb-6 flex gap-1">
		{#each CONFIGURATOR_STEPS as step, i}
			<button
				onclick={() => goto(step.path)}
				class="flex-1 rounded px-1 py-1.5 text-center text-xs transition-colors
					{i === currentIndex
					? 'bg-(--color-primary) text-white font-medium'
					: i < currentIndex
						? 'bg-(--color-primary)/10 text-(--color-primary) cursor-pointer hover:bg-(--color-primary)/20'
						: 'bg-(--color-surface-alt) text-(--color-text-muted)'}"
			>
				{step.shortLabel}
			</button>
		{/each}
	</div>

	<!-- Content -->
	<div class="flex-1">
		{@render children()}
	</div>

	<!-- Navigation -->
	<div class="mt-8 flex items-center justify-between border-t border-(--color-border) pt-4">
		<button
			onclick={goBack}
			disabled={isFirst}
			class="cursor-pointer rounded-lg px-6 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface-alt) disabled:cursor-default disabled:opacity-40"
		>
			&larr; Back
		</button>

		{#if isLast}
			<span class="text-xs text-(--color-text-muted)">Review your configuration below</span>
		{:else}
			<button
				onclick={goNext}
				class="cursor-pointer rounded-lg bg-(--color-primary) px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--color-primary-hover)"
			>
				Next &rarr;
			</button>
		{/if}
	</div>
</div>
