<script lang="ts">
	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		suffix?: string;
		onchange?: (value: number) => void;
	}

	let { value = $bindable(), min = 0, max = 99999, step = 1, suffix, onchange }: Props = $props();

	function adjust(delta: number) {
		const newVal = Math.min(max, Math.max(min, value + delta));
		value = newVal;
		onchange?.(newVal);
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const parsed = parseFloat(target.value);
		if (!isNaN(parsed)) {
			value = Math.min(max, Math.max(min, parsed));
			onchange?.(value);
		}
	}
</script>

<div class="inline-flex items-center gap-1">
	<button
		type="button"
		onclick={() => adjust(-step)}
		disabled={value <= min}
		class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-border) text-lg transition-colors hover:bg-(--color-surface-alt) disabled:cursor-not-allowed disabled:opacity-40"
	>
		−
	</button>
	<input
		type="number"
		{min}
		{max}
		{step}
		{value}
		oninput={handleInput}
		class="h-9 w-20 rounded-lg border border-(--color-border) bg-(--color-surface) px-2 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>
	{#if suffix}
		<span class="text-sm text-(--color-text-muted)">{suffix}</span>
	{/if}
	<button
		type="button"
		onclick={() => adjust(step)}
		disabled={value >= max}
		class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-border) text-lg transition-colors hover:bg-(--color-surface-alt) disabled:cursor-not-allowed disabled:opacity-40"
	>
		+
	</button>
</div>
