<script lang="ts">
	import { LayerCake, Svg } from 'layercake';
	import { scaleBand } from 'd3-scale';
	import ColumnLayer from './ColumnLayer.svelte';

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
</script>

<div style="height: 200px; position: relative;">
	<LayerCake
		{data}
		x="label"
		y="value"
		xScale={scaleBand().padding(0.15)}
		yDomain={[0, null]}
		padding={{ top: 30, right: 0, bottom: 25, left: 0 }}
	>
		<Svg>
			<ColumnLayer {formatValue} />
		</Svg>
	</LayerCake>
</div>
