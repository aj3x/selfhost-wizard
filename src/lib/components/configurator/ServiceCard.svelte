<script lang="ts">
	import type { ServiceModule } from '$lib/types/configurator';

	let {
		service,
		selected = false,
		dimmed = false,
		onToggle
	}: {
		service: ServiceModule;
		selected?: boolean;
		dimmed?: boolean;
		onToggle: (id: string) => void;
	} = $props();

	const skillColors: Record<string, string> = {
		beginner: 'bg-green-500/10 text-green-600',
		intermediate: 'bg-yellow-500/10 text-yellow-600',
		advanced: 'bg-red-500/10 text-red-600'
	};
</script>

<button
	onclick={() => onToggle(service.id)}
	aria-pressed={selected}
	class="group flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all
		focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)
		{selected
			? 'border-(--color-primary) bg-(--color-primary)/5'
			: 'border-(--color-border) hover:border-(--color-primary)/40'}
		{dimmed ? 'opacity-50' : ''}"
>
	<div aria-hidden="true" class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors
		{selected ? 'border-(--color-primary) bg-(--color-primary)' : 'border-(--color-border)'}">
		{#if selected}
			<svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<span class="font-medium">{service.name}</span>
			<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {skillColors[service.skillLevel]}">
				{service.skillLevel}
			</span>
		</div>
		<p class="mt-0.5 text-sm text-(--color-text-muted)">{service.description}</p>
	</div>
</button>
