<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		description?: string;
		children: Snippet;
	}

	let { label, description, children }: Props = $props();
</script>

<fieldset>
	<legend class="mb-1 text-lg font-semibold">{label}</legend>
	{#if description}
		<p class="mb-3 text-sm text-(--color-text-muted)">{description}</p>
	{/if}
	{@render children()}
</fieldset>
