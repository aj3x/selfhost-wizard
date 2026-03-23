<script lang="ts">
	import { LayerCake, Svg } from 'layercake';

	interface BarDatum {
		label: string;
		value: number;
		color: string;
	}

	interface Props {
		data: BarDatum[];
		formatValue?: (v: number) => string;
	}

	let { data, formatValue = (v) => `$${Math.round(v)}` }: Props = $props();

	let maxValue = $derived(Math.max(...data.map((d) => d.value), 1));
</script>

<div class="flex items-end gap-4" style="height: 200px;">
	{#each data as bar}
		{@const heightPct = (bar.value / maxValue) * 100}
		<div class="flex flex-1 flex-col items-center gap-2">
			<span class="text-sm font-semibold">{formatValue(bar.value)}</span>
			<div class="w-full flex-1 flex items-end">
				<div
					class="w-full rounded-t-lg transition-all duration-500"
					style="height: {heightPct}%; background-color: {bar.color}; min-height: 4px;"
				></div>
			</div>
			<span class="text-xs text-(--color-text-muted) text-center">{bar.label}</span>
		</div>
	{/each}
</div>
