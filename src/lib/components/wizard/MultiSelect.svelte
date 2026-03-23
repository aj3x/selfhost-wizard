<script lang="ts">
	interface Option {
		value: string;
		label: string;
		description?: string;
	}

	interface Props {
		options: Option[];
		selected: string[];
		onchange?: (selected: string[]) => void;
		columns?: 1 | 2 | 3;
	}

	let { options, selected = $bindable(), onchange, columns = 2 }: Props = $props();

	function toggle(value: string) {
		if (selected.includes(value)) {
			selected = selected.filter((v) => v !== value);
		} else {
			selected = [...selected, value];
		}
		onchange?.(selected);
	}
</script>

<div
	class="grid gap-3"
	class:grid-cols-1={columns === 1}
	class:grid-cols-2={columns === 2}
	class:grid-cols-3={columns === 3}
>
	{#each options as option}
		<button
			type="button"
			onclick={() => toggle(option.value)}
			class="cursor-pointer rounded-lg border-2 p-3 text-left transition-all
				{selected.includes(option.value)
				? 'border-(--color-primary) bg-(--color-primary)/5'
				: 'border-(--color-border) hover:border-(--color-primary)/50'}"
		>
			<div class="flex items-center gap-2">
				<div
					class="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs
						{selected.includes(option.value)
						? 'border-(--color-primary) bg-(--color-primary) text-white'
						: 'border-(--color-border)'}"
				>
					{#if selected.includes(option.value)}✓{/if}
				</div>
				<div class="text-sm font-medium">{option.label}</div>
			</div>
			{#if option.description}
				<div class="mt-1 pl-7 text-xs text-(--color-text-muted)">{option.description}</div>
			{/if}
		</button>
	{/each}
</div>
