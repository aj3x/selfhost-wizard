<script lang="ts">
	interface DataPoint {
		month: number;
		saas: number;
		selfHosted: number;
	}

	interface Props {
		data: DataPoint[];
		formatValue?: (v: number) => string;
	}

	let { data, formatValue = (v) => `$${Math.round(v)}` }: Props = $props();

	const WIDTH = 600;
	const HEIGHT = 250;
	const PADDING = { top: 20, right: 20, bottom: 30, left: 60 };

	let chartWidth = $derived(WIDTH - PADDING.left - PADDING.right);
	let chartHeight = $derived(HEIGHT - PADDING.top - PADDING.bottom);

	let maxY = $derived(Math.max(...data.map((d) => Math.max(d.saas, d.selfHosted)), 1));
	let maxX = $derived(Math.max(...data.map((d) => d.month), 1));

	function x(month: number) {
		return PADDING.left + (month / maxX) * chartWidth;
	}

	function y(value: number) {
		return PADDING.top + chartHeight - (value / maxY) * chartHeight;
	}

	let saasPath = $derived(
		data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.month)} ${y(d.saas)}`).join(' ')
	);

	let selfHostedPath = $derived(
		data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.month)} ${y(d.selfHosted)}`).join(' ')
	);

	// Find crossover point
	let crossoverMonth = $derived(
		data.find((d, i) => i > 0 && d.selfHosted < d.saas && data[i - 1].selfHosted >= data[i - 1].saas)?.month
	);

	// Y-axis ticks
	let yTicks = $derived(
		Array.from({ length: 5 }, (_, i) => Math.round((maxY / 4) * i))
	);
</script>

<div class="w-full overflow-x-auto">
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" class="w-full" style="max-height: 300px;">
		<!-- Y axis -->
		{#each yTicks as tick}
			<line
				x1={PADDING.left}
				y1={y(tick)}
				x2={WIDTH - PADDING.right}
				y2={y(tick)}
				stroke="var(--color-border)"
				stroke-dasharray="4,4"
			/>
			<text
				x={PADDING.left - 8}
				y={y(tick) + 4}
				text-anchor="end"
				fill="var(--color-text-muted)"
				font-size="10"
			>
				{formatValue(tick)}
			</text>
		{/each}

		<!-- X axis labels -->
		{#each [0, 12, 24, 36, 48, 60] as month}
			{#if month <= maxX}
				<text
					x={x(month)}
					y={HEIGHT - 5}
					text-anchor="middle"
					fill="var(--color-text-muted)"
					font-size="10"
				>
					{month === 0 ? 'Now' : `${month / 12}yr`}
				</text>
			{/if}
		{/each}

		<!-- SaaS line -->
		<path d={saasPath} fill="none" stroke="#ef4444" stroke-width="2.5" />

		<!-- Self-hosted line -->
		<path d={selfHostedPath} fill="none" stroke="#22c55e" stroke-width="2.5" />

		<!-- Crossover marker -->
		{#if crossoverMonth}
			<line
				x1={x(crossoverMonth)}
				y1={PADDING.top}
				x2={x(crossoverMonth)}
				y2={PADDING.top + chartHeight}
				stroke="var(--color-primary)"
				stroke-dasharray="4,4"
				stroke-width="1.5"
			/>
			<text
				x={x(crossoverMonth)}
				y={PADDING.top - 5}
				text-anchor="middle"
				fill="var(--color-primary)"
				font-size="10"
				font-weight="bold"
			>
				Break even
			</text>
		{/if}

		<!-- Legend -->
		<circle cx={PADDING.left + 10} cy={PADDING.top + 8} r="4" fill="#ef4444" />
		<text x={PADDING.left + 20} y={PADDING.top + 12} fill="var(--color-text)" font-size="11">
			SaaS
		</text>
		<circle cx={PADDING.left + 70} cy={PADDING.top + 8} r="4" fill="#22c55e" />
		<text x={PADDING.left + 80} y={PADDING.top + 12} fill="var(--color-text)" font-size="11">
			Self-hosted
		</text>
	</svg>
</div>
