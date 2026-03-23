<script lang="ts">
	import { CURRENCY_SYMBOLS, type Currency } from '$lib/types/assessment';

	interface Props {
		value: number;
		currency: Currency;
		onchange?: (value: number) => void;
		placeholder?: string;
	}

	let { value = $bindable(), currency, onchange, placeholder = '0.00' }: Props = $props();

	let symbol = $derived(CURRENCY_SYMBOLS[currency]);

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const parsed = parseFloat(target.value);
		if (!isNaN(parsed) && parsed >= 0) {
			value = parsed;
			onchange?.(parsed);
		} else if (target.value === '') {
			value = 0;
			onchange?.(0);
		}
	}
</script>

<div class="relative inline-flex items-center">
	<span class="absolute left-3 text-sm text-(--color-text-muted)">{symbol}</span>
	<input
		type="number"
		min="0"
		step="0.01"
		{value}
		oninput={handleInput}
		{placeholder}
		class="h-9 w-28 rounded-lg border border-(--color-border) bg-(--color-surface) pl-8 pr-3 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>
	<span class="ml-1 text-sm text-(--color-text-muted)">/mo</span>
</div>
