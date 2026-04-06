<script lang="ts">
	interface Props {
		text: string;
	}

	let { text }: Props = $props();
	let show = $state(false);
	const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') show = false;
	}
</script>

<span class="relative inline-block">
	<button
		type="button"
		aria-label="More information"
		aria-describedby={tooltipId}
		class="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-(--color-border) text-[10px] text-(--color-text-muted)"
		onmouseenter={() => (show = true)}
		onmouseleave={() => (show = false)}
		onfocus={() => (show = true)}
		onblur={() => (show = false)}
		onkeydown={handleKeydown}
	>
		<span aria-hidden="true">?</span>
	</button>
	{#if show}
		<div
			id={tooltipId}
			role="tooltip"
			class="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-(--color-border) bg-(--color-surface) p-3 text-xs text-(--color-text-muted) shadow-lg"
		>
			{text}
		</div>
	{/if}
</span>
