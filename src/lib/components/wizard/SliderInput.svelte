<script lang="ts">
	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		suffix?: string;
		onchange?: (value: number) => void;
	}

	let { value = $bindable(), min = 0, max = 100, step = 1, suffix, onchange }: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = parseFloat(target.value);
		onchange?.(value);
	}
</script>

<div class="flex items-center gap-3">
	<input
		type="range"
		{min}
		{max}
		{step}
		{value}
		oninput={handleInput}
		class="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-(--color-border) accent-(--color-primary)"
	/>
	<span class="w-20 text-right text-sm font-medium tabular-nums">
		{value}{suffix ?? ''}
	</span>
</div>
