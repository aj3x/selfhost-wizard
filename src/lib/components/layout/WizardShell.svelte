<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { assessment } from '$lib/stores/assessment';

	export const WIZARD_STEPS = [
		{ path: '/assess/about-you', label: 'About You', shortLabel: 'You' },
		{ path: '/assess/hardware', label: 'Hardware', shortLabel: 'HW' },
		{ path: '/assess/subscriptions', label: 'Subscriptions', shortLabel: 'Subs' },
		{ path: '/assess/media', label: 'Media', shortLabel: 'Media' },
		{ path: '/assess/photos', label: 'Photos', shortLabel: 'Photos' },
		{ path: '/assess/files', label: 'Files', shortLabel: 'Files' },
		{ path: '/assess/network', label: 'Network', shortLabel: 'Net' },
		{ path: '/assess/security', label: 'Security', shortLabel: 'Sec' },
		{ path: '/assess/time', label: 'Time & Maintenance', shortLabel: 'Time' }
	] as const;

	let { children } = $props();

	let currentIndex = $derived(WIZARD_STEPS.findIndex((s) => page.route.id === s.path));
	let isFirst = $derived(currentIndex <= 0);
	let isLast = $derived(currentIndex >= WIZARD_STEPS.length - 1);
	let progress = $derived(((currentIndex + 1) / WIZARD_STEPS.length) * 100);
	let skill = $derived($assessment.skillLevel);

	function goBack() {
		if (isFirst) {
			goto(resolve('/assess/quick-start'));
		} else {
			goto(resolve(WIZARD_STEPS[currentIndex - 1].path));
		}
	}

	function goNext() {
		if (isLast) {
			goto(resolve('/results'));
		} else {
			goto(resolve(WIZARD_STEPS[currentIndex + 1].path));
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
			e.preventDefault();
			goNext();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
	<!-- Top bar: progress + quick start link -->
	<div class="mb-2 flex items-center justify-between">
		<span class="text-sm text-(--color-text-muted)">
			Step {currentIndex + 1} of {WIZARD_STEPS.length}
		</span>
		<div class="flex items-center gap-3">
			<a
				href={resolve('/assess/quick-start')}
				class="text-xs text-(--color-primary) hover:underline"
			>
				Quick Start Tips
			</a>
			<span class="text-sm font-medium">
				{currentIndex >= 0 ? WIZARD_STEPS[currentIndex].label : ''}
			</span>
		</div>
	</div>

	<div class="mb-8 h-2 w-full overflow-hidden rounded-full bg-(--color-border)">
		<div
			class="h-full rounded-full bg-(--color-primary) transition-all duration-300"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Step indicators (desktop) -->
	<div class="mb-8 hidden gap-1 md:flex">
		{#each WIZARD_STEPS as step, i}
			<button
				onclick={() => goto(resolve(step.path))}
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
			class="cursor-pointer rounded-lg px-6 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-surface-alt)"
		>
			&larr; {isFirst ? 'Quick Start' : 'Back'}
		</button>

		<button
			onclick={goNext}
			class="cursor-pointer rounded-lg bg-(--color-primary) px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--color-primary-hover)"
		>
			{isLast ? 'See Results' : 'Next'} &rarr;
		</button>
	</div>
</div>
