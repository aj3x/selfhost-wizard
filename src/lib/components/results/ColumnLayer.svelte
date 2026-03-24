<script lang="ts">
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';

	interface Props {
		formatValue?: (v: number) => string;
	}

	let { formatValue = (v: number) => `$${Math.round(v)}` }: Props = $props();

	const { data, xScale, yScale, height } = getContext<{
		data: Readable<Array<{ label: string; value: number; color: string }>>;
		xScale: Readable<((label: string) => number) & { bandwidth: () => number }>;
		yScale: Readable<(value: number) => number>;
		height: Readable<number>;
	}>('LayerCake');
</script>

{#each $data as d}
	{@const bx = $xScale(d.label) ?? 0}
	{@const bw = $xScale.bandwidth()}
	{@const by = $yScale(d.value)}
	{@const bh = Math.max($height - by, 2)}

	<rect x={bx} y={by} width={bw} height={bh} fill={d.color} rx="4" ry="4" />

	<text
		x={bx + bw / 2}
		y={by - 6}
		text-anchor="middle"
		font-size="11"
		font-weight="600"
		fill="currentColor"
	>{formatValue(d.value)}</text>

	<text
		x={bx + bw / 2}
		y={$height + 16}
		text-anchor="middle"
		font-size="11"
		fill="var(--color-text-muted)"
	>{d.label}</text>
{/each}
