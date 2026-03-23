<script lang="ts">
	import type { Currency } from '$lib/types/assessment';
	import { CURRENCY_SYMBOLS } from '$lib/types/assessment';

	interface Props {
		name: string;
		monthlyCost: number;
		enabled: boolean;
		currency: Currency;
		editable?: boolean;
		ontoggle?: (enabled: boolean) => void;
		oncostchange?: (cost: number) => void;
	}

	let {
		name,
		monthlyCost = $bindable(),
		enabled = $bindable(),
		currency,
		editable = true,
		ontoggle,
		oncostchange
	}: Props = $props();

	let symbol = $derived(CURRENCY_SYMBOLS[currency]);

	function toggle() {
		enabled = !enabled;
		ontoggle?.(enabled);
	}

	function handleCostInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const parsed = parseFloat(target.value);
		if (!isNaN(parsed) && parsed >= 0) {
			monthlyCost = parsed;
			oncostchange?.(parsed);
		}
	}
</script>

<div
	class="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors
		{enabled ? 'border-(--color-primary) bg-(--color-primary)/5' : 'border-(--color-border)'}"
>
	<button type="button" onclick={toggle} class="flex cursor-pointer items-center gap-3">
		<div
			class="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs
				{enabled
				? 'border-(--color-primary) bg-(--color-primary) text-white'
				: 'border-(--color-border)'}"
		>
			{#if enabled}✓{/if}
		</div>
		<span class="text-sm font-medium">{name}</span>
	</button>

	{#if editable && enabled}
		<div class="relative flex items-center">
			<span class="absolute left-2 text-xs text-(--color-text-muted)">{symbol}</span>
			<input
				type="number"
				min="0"
				step="0.01"
				value={monthlyCost}
				oninput={handleCostInput}
				class="h-7 w-20 rounded border border-(--color-border) bg-(--color-surface) pl-6 pr-1 text-right text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			<span class="ml-1 text-xs text-(--color-text-muted)">/mo</span>
		</div>
	{:else if !editable}
		<span class="text-sm text-(--color-text-muted)">
			{symbol}{monthlyCost.toFixed(2)}/mo
		</span>
	{/if}
</div>
