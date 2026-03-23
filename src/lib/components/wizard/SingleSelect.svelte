<script lang="ts" generics="T extends string">
	interface Option {
		value: T;
		label: string;
		description?: string;
	}

	interface Props {
		options: Option[];
		value: T;
		onchange?: (value: T) => void;
		columns?: 1 | 2 | 3 | 4;
	}

	let { options, value = $bindable(), onchange, columns = 2 }: Props = $props();

	function select(v: T) {
		value = v;
		onchange?.(v);
	}
</script>

<div
	class="grid gap-3"
	class:grid-cols-1={columns === 1}
	class:grid-cols-2={columns === 2}
	class:grid-cols-3={columns === 3}
	class:grid-cols-4={columns === 4}
>
	{#each options as option}
		<button
			type="button"
			onclick={() => select(option.value)}
			class="cursor-pointer rounded-lg border-2 p-3 text-left transition-all
				{value === option.value
				? 'border-(--color-primary) bg-(--color-primary)/5'
				: 'border-(--color-border) hover:border-(--color-primary)/50'}"
		>
			<div class="text-sm font-medium">{option.label}</div>
			{#if option.description}
				<div class="mt-1 text-xs text-(--color-text-muted)">{option.description}</div>
			{/if}
		</button>
	{/each}
</div>
