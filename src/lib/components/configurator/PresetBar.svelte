<script lang="ts">
	import { PRESETS, type Preset } from '$lib/types/configurator';
	import type { SkillLevel } from '$lib/types/assessment';

	let {
		skillLevel = 'beginner' as SkillLevel,
		activePreset = null as string | null,
		onApply
	}: {
		skillLevel?: SkillLevel;
		activePreset?: string | null;
		onApply: (preset: Preset) => void;
	} = $props();

	const skillOrder: Record<SkillLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

	let visiblePresets = $derived(
		PRESETS.filter((p) => skillOrder[p.skillLevel] <= skillOrder[skillLevel])
	);
</script>

<section class="mb-6" aria-labelledby="presets-heading">
	<h3 id="presets-heading" class="mb-2 text-sm font-medium text-(--color-text-muted)">Quick Start Presets</h3>
	<div class="pill-group" role="group" aria-label="Preset options">
		{#each visiblePresets as preset}
			<button
				onclick={() => onApply(preset)}
				aria-pressed={activePreset === preset.id}
				class="cursor-pointer rounded-lg border px-3 py-2 text-left text-sm transition-colors
					focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)
					{activePreset === preset.id
						? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)'
						: 'border-(--color-border) hover:border-(--color-primary)/40'}"
			>
				<span class="font-medium">{preset.name}</span>
				<span class="block text-xs text-(--color-text-muted)">{preset.description}</span>
			</button>
		{/each}
	</div>
</section>
